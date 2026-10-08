// QtoMate takeoff workspace.
// Everything runs in the browser. The PDF is never uploaded; only "AI draft"
// sends an image of the current page to the Anthropic API with the user's own key.
import * as pdfjsLib from "./vendor/pdf.min.mjs";
import { LANGS, LANG_NAMES, makeT } from "./i18n.js?v=20261009b";
import { SnapIndex, buildSnapIndex } from "./snap.js?v=20261009b";

const VENDOR = new URL("./vendor/", import.meta.url).href;
pdfjsLib.GlobalWorkerOptions.workerSrc = VENDOR + "pdf.worker.min.mjs";

const M_PER_PT = 0.0254 / 72; // metres per PDF point at 1:1
const FT_PER_M = 3.280839895;
const SVGNS = "http://www.w3.org/2000/svg";
const DEFAULT_MODEL = "claude-sonnet-5-5";
const $ = (id) => document.getElementById(id);

const state = {
  lang: "en",
  pdf: null,
  fileName: "",
  fileKey: "",
  pageNum: 1,
  pageCount: 0,
  pageSize: { w: 0, h: 0 }, // in points, at zoom 1
  zoom: 1,
  tool: "select",
  unitSystem: "metric",
  scales: {}, // per page: { mpp, label }
  scaleAll: null, // default for every page
  items: [], // { id, type, name, page, points, status, origin }
  counters: { length: 0, area: 0, count: 0 },
  selectedId: null,
  draft: null, // { type, points }
  cursor: null,
  calibPts: null,
  snapOn: true,
  snap: null, // { x, y, kind } under the cursor
  snapIndex: null, // geometry of the current page, once it has been read
};
let t = makeT("en");
let renderSeq = 0;
let curPage = null;
let baseTask = null, baseKey = "", baseRs = 0;
let detailTask = null, detailTimer = 0;
const MAX_BASE_PIXELS = 12e6; // whole-page bitmap; sharper detail is drawn only for the visible part
const ZOOM_MIN = 0.05, ZOOM_MAX = 16;
const snapCache = new Map(); // page number -> SnapIndex or a promise of one
let snapNoticeShown = false;
const hist = { undo: [], redo: [] };
let lastPtr = null; // last pointer position over the sheet
let overSheet = false;
let spaceDown = false;
let edit = null; // corner being dragged: { id, index, insert, moved }

/* ------------------------------------------------------------------ i18n */
function pickLang() {
  const q = new URLSearchParams(location.search).get("lang");
  let saved = null;
  try { saved = localStorage.getItem("qtomate:lang"); } catch (e) { /* storage unavailable */ }
  const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
  for (const c of [q, saved, nav]) if (c && LANGS.includes(c)) return c;
  return "en";
}

function applyLang(lang) {
  state.lang = lang;
  t = makeT(lang);
  try { localStorage.setItem("qtomate:lang", lang); } catch (e) { /* ignore */ }
  document.documentElement.lang = lang;
  document.title = t("title");
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => { el.title = t(el.dataset.i18nTitle) + (el.dataset.key ? ` (${el.dataset.key})` : ""); });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
  $("home-link").href = lang === "en" ? "../" : `../${lang}/`;
  $("lang").value = lang;
  buildPresets();
  buildCalibUnits();
  updateHint();
  if (state.pdf) { updatePageLabel(); updateScaleChip(); drawOverlay(); renderRows(); }
}

/* ------------------------------------------------------------ quantities */
const pageScale = (n) => state.scales[n] || state.scaleAll || null;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function polyLength(pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]);
  return s;
}
function polyArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(s) / 2;
}

/** Returns { ok, value, unit } for an item in the current unit system. */
function measure(item) {
  if (item.type === "count") return { ok: true, value: item.points.length, unit: t("unit_no"), decimals: 0 };
  const sc = pageScale(item.page);
  if (!sc) return { ok: false };
  const imperial = state.unitSystem === "imperial";
  if (item.type === "length") {
    const m = polyLength(item.points) * sc.mpp;
    return { ok: true, value: imperial ? m * FT_PER_M : m, unit: t(imperial ? "unit_ft" : "unit_m"), decimals: 2 };
  }
  const m2 = polyArea(item.points) * sc.mpp * sc.mpp;
  return { ok: true, value: imperial ? m2 * FT_PER_M * FT_PER_M : m2, unit: t(imperial ? "unit_ft2" : "unit_m2"), decimals: 2 };
}
function fmt(value, decimals) {
  try {
    return new Intl.NumberFormat(state.lang, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  } catch (e) {
    return value.toFixed(decimals);
  }
}
function qtyText(item) {
  const q = measure(item);
  return q.ok ? `${fmt(q.value, q.decimals)} ${q.unit}` : null;
}
/** Length in page points as text in the current units, or null when the page has no scale. */
function lenText(pt, pageNum) {
  const sc = pageScale(pageNum || state.pageNum);
  if (!sc) return null;
  const imperial = state.unitSystem === "imperial";
  const m = pt * sc.mpp;
  return `${fmt(imperial ? m * FT_PER_M : m, 2)} ${t(imperial ? "unit_ft" : "unit_m")}`;
}
function areaText(pt2, pageNum) {
  const sc = pageScale(pageNum || state.pageNum);
  if (!sc) return null;
  const imperial = state.unitSystem === "imperial";
  const m2 = pt2 * sc.mpp * sc.mpp;
  return `${fmt(imperial ? m2 * FT_PER_M * FT_PER_M : m2, 2)} ${t(imperial ? "unit_ft2" : "unit_m2")}`;
}

/* -------------------------------------------------------------- storage */
function save() {
  if (!state.fileKey) return;
  try {
    localStorage.setItem(state.fileKey, JSON.stringify({
      items: state.items, scales: state.scales, scaleAll: state.scaleAll,
      unitSystem: state.unitSystem, counters: state.counters,
    }));
  } catch (e) { /* storage full or unavailable: the session still works */ }
}
function restore() {
  try {
    const raw = localStorage.getItem(state.fileKey);
    if (!raw) return 0;
    const d = JSON.parse(raw);
    state.items = Array.isArray(d.items) ? d.items.filter((it) => it.page <= state.pageCount) : [];
    state.scales = d.scales || {};
    state.scaleAll = d.scaleAll || null;
    state.unitSystem = d.unitSystem === "imperial" ? "imperial" : "metric";
    state.counters = Object.assign({ length: 0, area: 0, count: 0 }, d.counters);
    return state.items.length;
  } catch (e) { return 0; }
}

/* -------------------------------------------------------------- history */
const snapshot = () => JSON.stringify({ items: state.items, counters: state.counters, scales: state.scales, scaleAll: state.scaleAll });
function pushHistory() {
  hist.undo.push(snapshot());
  if (hist.undo.length > 80) hist.undo.shift();
  hist.redo.length = 0;
  updateHistoryButtons();
}
function applySnapshot(json) {
  const d = JSON.parse(json);
  state.items = d.items; state.counters = d.counters; state.scales = d.scales; state.scaleAll = d.scaleAll;
  if (!state.items.some((i) => i.id === state.selectedId)) state.selectedId = null;
  save(); updateScaleChip(); renderRows(); drawOverlay(); updateHistoryButtons();
}
function undo() {
  if (state.draft && state.draft.points.length) { undoPoint(); return; }
  const s = hist.undo.pop();
  if (!s) return;
  hist.redo.push(snapshot());
  applySnapshot(s);
}
function redo() {
  const s = hist.redo.pop();
  if (!s) return;
  hist.undo.push(snapshot());
  applySnapshot(s);
}
function updateHistoryButtons() {
  $("undo-btn").disabled = !hist.undo.length && !(state.draft && state.draft.points.length);
  $("redo-btn").disabled = !hist.redo.length;
}

/* ---------------------------------------------------------------- toast */
let toastTimer = 0;
function toast(msg, isError) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.toggle("error", !!isError);
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), isError ? 9000 : 5000);
}

/* ----------------------------------------------------------- PDF loading */
async function openPdf(buffer, name, size) {
  try {
    const task = pdfjsLib.getDocument({
      data: buffer,
      cMapUrl: VENDOR + "cmaps/", cMapPacked: true,
      standardFontDataUrl: VENDOR + "standard_fonts/",
      wasmUrl: VENDOR + "wasm/", iccUrl: VENDOR + "iccs/",
    });
    const pdf = await task.promise;
    if (state.pdf) { try { await state.pdf.destroy(); } catch (e) { /* ignore */ } }
    state.pdf = pdf;
  } catch (e) {
    console.error(e);
    toast(t("err_pdf"), true);
    return;
  }
  state.fileName = name;
  state.fileKey = `qtomate:project:${name}:${size}`;
  state.pageCount = state.pdf.numPages;
  state.pageNum = 1;
  state.items = []; state.scales = {}; state.scaleAll = null;
  state.counters = { length: 0, area: 0, count: 0 };
  state.selectedId = null; state.draft = null; state.calibPts = null;
  state.snap = null; state.snapIndex = null; state.cursor = null;
  snapCache.clear(); snapNoticeShown = false;
  hist.undo.length = 0; hist.redo.length = 0;
  baseKey = ""; curPage = null;
  const restored = restore();
  $("unit-system").value = state.unitSystem;
  $("file-name").textContent = name;
  $("empty").hidden = true;
  $("stage").hidden = false;
  $("open-other").hidden = false;
  setTool("select");
  buildPresets();
  await renderPage(true);
  renderRows();
  updateHistoryButtons();
  if (restored) toast(t("restored", { n: restored }));
}

async function openFile(file) {
  if (!file) return;
  const buffer = await file.arrayBuffer();
  await openPdf(buffer, file.name, file.size);
}

async function openSample() {
  try {
    const res = await fetch(new URL("./sample/qtomate-sample-A-101.pdf", import.meta.url));
    if (!res.ok) throw new Error(String(res.status));
    const buffer = await res.arrayBuffer();
    await openPdf(buffer, "QtoMate-sample-A-101.pdf", buffer.byteLength);
  } catch (e) {
    console.error(e);
    toast(t("err_pdf"), true);
  }
}

/* ------------------------------------------------------------- rendering */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);

function layoutSheet() {
  const cssW = state.pageSize.w * state.zoom, cssH = state.pageSize.h * state.zoom;
  const canvas = $("canvas");
  canvas.style.width = cssW + "px"; canvas.style.height = cssH + "px";
  $("sheet").style.width = cssW + "px"; $("sheet").style.height = cssH + "px";
  $("overlay").setAttribute("viewBox", `0 0 ${state.pageSize.w} ${state.pageSize.h}`);
  $("zoom-label").textContent = Math.round(state.zoom * 100) + "%";
}

async function renderPage(fit) {
  const seq = ++renderSeq;
  const pageNum = state.pageNum;
  const page = await state.pdf.getPage(pageNum);
  if (seq !== renderSeq) return;
  curPage = page;
  const vp1 = page.getViewport({ scale: 1 });
  state.pageSize = { w: vp1.width, h: vp1.height };
  const scroller = $("scroller");
  if (fit) {
    const z = Math.min((scroller.clientWidth - 48) / vp1.width, (scroller.clientHeight - 48) / vp1.height);
    state.zoom = clamp(z || 1, ZOOM_MIN, ZOOM_MAX);
  }
  hideDetail();
  layoutSheet();
  updatePageLabel(); updateScaleChip(); drawOverlay();
  useSnapIndex();

  // The whole page is drawn once at a bounded size. Beyond that size, only the part
  // on screen is drawn at full sharpness (see renderDetail).
  const need = state.zoom * pixelRatio();
  const rs = Math.min(need, Math.sqrt(MAX_BASE_PIXELS / (vp1.width * vp1.height)));
  const key = `${state.fileKey}|${pageNum}|${rs.toFixed(4)}`;
  if (key !== baseKey) {
    if (baseTask) { try { baseTask.cancel(); } catch (e) { /* ignore */ } }
    const old = $("canvas");
    if (!baseKey.startsWith(`${state.fileKey}|${pageNum}|`)) old.width = old.width; // another page: clear it
    baseKey = "";
    const vp = page.getViewport({ scale: rs });
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.floor(vp.width)); c.height = Math.max(1, Math.floor(vp.height));
    const task = baseTask = page.render({ canvas: c, canvasContext: c.getContext("2d"), viewport: vp });
    try { await task.promise; } catch (e) {
      if (e && e.name !== "RenderingCancelledException") console.error(e);
      return;
    }
    if (seq !== renderSeq) return;
    c.id = "canvas";
    $("canvas").replaceWith(c);
    baseKey = key; baseRs = rs;
    layoutSheet();
  }
  scheduleDetail(0);
}

function hideDetail() {
  clearTimeout(detailTimer);
  if (detailTask) { try { detailTask.cancel(); } catch (e) { /* ignore */ } detailTask = null; }
  $("detail").hidden = true;
}
function scheduleDetail(delay) {
  clearTimeout(detailTimer);
  detailTimer = setTimeout(renderDetail, delay);
}
/** Draws the visible part of the sheet at full resolution on top of the base bitmap. */
async function renderDetail() {
  if (!state.pdf || !curPage || !baseKey) return;
  const dpr = pixelRatio();
  const need = state.zoom * dpr;
  if (baseRs >= need * 0.999) { $("detail").hidden = true; return; }
  const seq = renderSeq, zoom = state.zoom, page = curPage;
  const sc = $("scroller").getBoundingClientRect(), sh = $("sheet").getBoundingClientRect();
  const mx = sc.width * 0.25, my = sc.height * 0.25;
  const x0 = Math.floor(clamp(sc.left - sh.left - mx, 0, sh.width)), x1 = Math.ceil(clamp(sc.right - sh.left + mx, 0, sh.width));
  const y0 = Math.floor(clamp(sc.top - sh.top - my, 0, sh.height)), y1 = Math.ceil(clamp(sc.bottom - sh.top + my, 0, sh.height));
  if (x1 - x0 < 2 || y1 - y0 < 2) { $("detail").hidden = true; return; }
  const c = document.createElement("canvas");
  c.width = Math.round((x1 - x0) * dpr); c.height = Math.round((y1 - y0) * dpr);
  if (detailTask) { try { detailTask.cancel(); } catch (e) { /* ignore */ } }
  const task = detailTask = page.render({
    canvas: c, canvasContext: c.getContext("2d"),
    viewport: page.getViewport({ scale: need }),
    transform: [1, 0, 0, 1, -x0 * dpr, -y0 * dpr],
  });
  try { await task.promise; } catch (e) {
    if (e && e.name !== "RenderingCancelledException") console.error(e);
    return;
  }
  if (detailTask === task) detailTask = null;
  if (seq !== renderSeq || zoom !== state.zoom || page !== curPage) return;
  c.id = "detail";
  c.style.left = x0 + "px"; c.style.top = y0 + "px";
  c.style.width = (x1 - x0) + "px"; c.style.height = (y1 - y0) + "px";
  $("detail").replaceWith(c);
}

/* -------------------------------------------------------------- snapping */
function useSnapIndex() {
  const n = state.pageNum, pdf = state.pdf;
  const hit = snapCache.get(n);
  state.snapIndex = hit instanceof SnapIndex ? hit : null;
  updateSnapButton();
  if (hit) return;
  const job = pdf.getPage(n).then((page) => buildSnapIndex(page, pdfjsLib)).then((index) => {
    if (state.pdf !== pdf) return;
    snapCache.set(n, index);
    for (const k of snapCache.keys()) { if (snapCache.size <= 6) break; if (k !== state.pageNum) snapCache.delete(k); }
    if (state.pageNum !== n) return;
    state.snapIndex = index;
    updateSnapButton();
    if (!index.count && state.snapOn && !snapNoticeShown) { snapNoticeShown = true; toast(t("snap_none")); }
    if (lastPtr && overSheet) onMove(lastPtr);
  }).catch((e) => { console.error(e); if (state.pdf === pdf) snapCache.delete(n); });
  snapCache.set(n, job);
}
function updateSnapButton() {
  const b = $("snap-btn");
  b.setAttribute("aria-pressed", state.snapOn ? "true" : "false");
  b.classList.toggle("loading", state.snapOn && !!state.pdf && !state.snapIndex);
  b.classList.toggle("empty", !!state.snapIndex && !state.snapIndex.count);
}
function setSnap(on) {
  state.snapOn = on;
  try { localStorage.setItem("qtomate:snap", on ? "1" : "0"); } catch (e) { /* ignore */ }
  if (!on) state.snap = null;
  updateSnapButton();
  if (lastPtr && overSheet) onMove(lastPtr); else drawLive();
}
/** Nearest real point to p: the drawing's own geometry, or a corner of a measurement. */
function findSnap(p, exclude) {
  const z = state.zoom;
  const tolPoint = 13 / z, tolLine = 8 / z;
  const best = state.snapIndex ? state.snapIndex.query(p[0], p[1], tolPoint, tolLine) : null;
  let vd = tolPoint, v = null;
  const test = (q) => { const d = dist(p, q); if (d < vd) { vd = d; v = q; } };
  for (const it of state.items) {
    if (it.page !== state.pageNum) continue;
    for (let i = 0; i < it.points.length; i++) {
      if (exclude && exclude.id === it.id && exclude.index === i) continue;
      test(it.points[i]);
    }
  }
  if (state.draft) state.draft.points.forEach(test);
  if (state.calibPts) state.calibPts.forEach(test);
  if (v && (!best || best.kind === "line" || vd <= best.d + 0.5 / z)) return { x: v[0], y: v[1], kind: "vertex", d: vd };
  return best;
}

function updatePageLabel() {
  const input = $("page-input");
  if (document.activeElement !== input) input.value = state.pageNum;
  input.max = state.pageCount;
  input.title = t("page_of", { n: state.pageNum, total: state.pageCount });
  $("page-total").textContent = "/ " + state.pageCount;
  $("prev").disabled = state.pageNum <= 1;
  $("next").disabled = state.pageNum >= state.pageCount;
}
function updateScaleChip() {
  const sc = pageScale(state.pageNum);
  const chip = $("scale-chip");
  chip.textContent = sc ? sc.label : t("scale_none");
  chip.classList.toggle("missing", !sc);
  document.querySelectorAll("#presets button").forEach((b) => b.setAttribute("aria-pressed", sc && b.dataset.label === sc.label ? "true" : "false"));
}
async function goToPage(n) {
  n = clamp(Math.round(n) || 1, 1, state.pageCount);
  if (n === state.pageNum) { updatePageLabel(); return; }
  cancelDraft();
  state.pageNum = n;
  await renderPage(true);
  $("scroller").scrollTo(0, 0);
}
let zoomTimer = 0;
function setZoom(z, anchor) {
  const scroller = $("scroller");
  const old = state.zoom;
  z = clamp(z, ZOOM_MIN, ZOOM_MAX);
  if (Math.abs(z - old) < 1e-4) return;
  const rect = scroller.getBoundingClientRect();
  const ax = anchor ? anchor.x : rect.left + rect.width / 2;
  const ay = anchor ? anchor.y : rect.top + rect.height / 2;
  const sheet = $("sheet").getBoundingClientRect();
  const px = ax - sheet.left, py = ay - sheet.top; // anchor on the sheet, css px
  const k = z / old;
  state.zoom = z;
  $("detail").hidden = true;
  layoutSheet();
  const sheet2 = $("sheet").getBoundingClientRect();
  scroller.scrollLeft += (sheet2.left + px * k) - ax;
  scroller.scrollTop += (sheet2.top + py * k) - ay;
  drawOverlay();
  if (lastPtr && overSheet) onMove(lastPtr);
  clearTimeout(zoomTimer);
  zoomTimer = setTimeout(() => renderPage(false), 120);
}

/* --------------------------------------------------------------- overlay */
function el(name, attrs, parent) {
  const n = document.createElementNS(SVGNS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
const ptsAttr = (pts) => pts.map((p) => p[0].toFixed(2) + "," + p[1].toFixed(2)).join(" ");

function labelAnchor(item) {
  const p = item.points;
  if (item.type === "area") {
    let x = 0, y = 0;
    for (const q of p) { x += q[0]; y += q[1]; }
    return [x / p.length, y / p.length];
  }
  if (item.type === "length") {
    let best = 0, bi = 1;
    for (let i = 1; i < p.length; i++) { const d = dist(p[i - 1], p[i]); if (d > best) { best = d; bi = i; } }
    return [(p[bi - 1][0] + p[bi][0]) / 2, (p[bi - 1][1] + p[bi][1]) / 2 - 8 / state.zoom];
  }
  return [p[0][0] + 12 / state.zoom, p[0][1] - 10 / state.zoom];
}

function layer(id) {
  const svg = $("overlay");
  let g = svg.querySelector("#" + id);
  if (!g) g = el("g", { id }, svg);
  while (g.firstChild) g.removeChild(g.firstChild);
  return g;
}

function drawOverlay() {
  drawItems();
  drawLive();
}

function drawItems() {
  const svg = layer("g-items");
  const z = state.zoom;
  // the selected measurement is drawn last so that it, and its corners, stay on top
  const onPage = state.items.filter((i) => i.page === state.pageNum);
  onPage.sort((a, b) => (a.id === state.selectedId) - (b.id === state.selectedId));
  for (const item of onPage) {
    const selected = item.id === state.selectedId;
    const cls = ["item", item.origin === "ai" ? "ai" : "", item.status === "approved" ? "approved" : "", selected ? "selected" : ""].join(" ");
    const g = el("g", { class: cls, "data-id": item.id }, svg);
    if (item.type === "length") {
      el("polyline", { class: "shape length", points: ptsAttr(item.points) }, g);
      el("polyline", { class: "hit", points: ptsAttr(item.points) }, g);
    } else if (item.type === "area") {
      el("polygon", { class: "shape area", points: ptsAttr(item.points) }, g);
    } else {
      item.points.forEach((p, i) => el("circle", { class: "dot", cx: p[0], cy: p[1], r: 6.5 / z, "data-i": i }, g));
    }
    const q = qtyText(item);
    if (q) {
      const a = labelAnchor(item);
      const txt = el("text", { class: "label", x: a[0], y: a[1], "font-size": 13 / z, "text-anchor": item.type === "count" ? "start" : "middle" }, g);
      txt.textContent = item.type === "count" ? `${item.name}: ${q}` : q;
    }
    // corners of the selected measurement can be dragged
    if (selected && state.tool === "select" && item.type !== "count") {
      const p = item.points, n = p.length;
      const edges = item.type === "area" ? n : n - 1;
      for (let i = 0; i < edges; i++) {
        const a = p[i], b = p[(i + 1) % n];
        if (dist(a, b) * z > 44) el("circle", { class: "handle mid", cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2, r: 4 / z, "data-i": i + 1 }, g);
      }
      p.forEach((q2, i) => el("circle", { class: "handle", cx: q2[0], cy: q2[1], r: 5.5 / z, "data-i": i }, g));
    }
  }
}

const MARKS = {
  end: (x, y, r) => `M${x - r} ${y - r}h${2 * r}v${2 * r}h${-2 * r}z`,
  vertex: (x, y, r) => `M${x} ${y - r * 1.25}L${x + r * 1.25} ${y}L${x} ${y + r * 1.25}L${x - r * 1.25} ${y}z`,
  mid: (x, y, r) => `M${x} ${y - r}L${x + r} ${y + r}L${x - r} ${y + r}z`,
  int: (x, y, r) => `M${x - r} ${y - r}L${x + r} ${y + r}M${x + r} ${y - r}L${x - r} ${y + r}`,
  line: (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`,
};

/** Draws what follows the cursor: the shape being drawn and the snap marker. */
function drawLive() {
  const svg = layer("g-live");
  const z = state.zoom;
  const d = state.draft;
  if (d && d.points.length) {
    const pts = state.cursor && d.type !== "count" ? d.points.concat([state.cursor]) : d.points;
    if (d.type === "area" && pts.length >= 3) el("polygon", { class: "draft", points: ptsAttr(pts) }, svg);
    else if (d.type !== "count") el("polyline", { class: "draft", points: ptsAttr(pts), fill: "none" }, svg);
    for (const p of d.points) el("circle", { class: "draft-dot", cx: p[0], cy: p[1], r: (d.type === "count" ? 6.5 : 4) / z }, svg);
  }
  if (state.calibPts && state.calibPts.length) {
    const pts = state.calibPts.length === 1 && state.cursor ? state.calibPts.concat([state.cursor]) : state.calibPts;
    el("polyline", { class: "draft", points: ptsAttr(pts), fill: "none" }, svg);
    for (const p of state.calibPts) el("circle", { class: "draft-dot", cx: p[0], cy: p[1], r: 4 / z }, svg);
  }
  const s = state.snap;
  if (s && MARKS[s.kind]) {
    const path = MARKS[s.kind](s.x, s.y, 6.5 / z);
    el("path", { class: "snap-halo", d: path }, svg);
    el("path", { class: "snap-mark " + s.kind, d: path }, svg);
  }
}

/** The small box next to the cursor with the live quantity. */
function updateReadout() {
  const box = $("readout");
  const lines = [];
  const d = state.draft, cur = state.cursor;
  if (state.tool === "calibrate") {
    if (state.calibPts && state.calibPts.length === 1 && cur) { const s = lenText(dist(state.calibPts[0], cur)); if (s) lines.push([s, "main"]); }
  } else if (d && d.points.length && d.type === "count") {
    lines.push([`${d.points.length} ${t("unit_no")}`, "main"]);
  } else if (d && d.points.length && cur) {
    const pts = d.points.concat([cur]);
    const seg = lenText(dist(d.points[d.points.length - 1], cur));
    if (!seg) lines.push([t("scale_none"), "warn"]);
    else if (d.type === "length") {
      lines.push([seg, "main"]);
      if (pts.length > 2) lines.push([`${t("total")} ${lenText(polyLength(pts))}`, ""]);
    } else {
      if (pts.length >= 3) lines.push([areaText(polyArea(pts)), "main"]);
      lines.push([seg, pts.length >= 3 ? "" : "main"]);
    }
  }
  if (state.snap && state.tool !== "select") lines.push([t("snap_" + state.snap.kind), "snap"]);
  if (!lines.length || !lastPtr || !overSheet) { box.hidden = true; return; }
  box.textContent = "";
  for (const [text, cls] of lines) {
    const row = document.createElement("div");
    if (cls) row.className = cls;
    row.textContent = text;
    box.appendChild(row);
  }
  box.hidden = false;
  const w = box.offsetWidth, h = box.offsetHeight;
  let x = lastPtr.clientX + 20, y = lastPtr.clientY + 22;
  if (x + w > window.innerWidth - 8) x = lastPtr.clientX - w - 16;
  if (y + h > window.innerHeight - 8) y = lastPtr.clientY - h - 16;
  box.style.left = Math.max(4, x) + "px"; box.style.top = Math.max(4, y) + "px";
}

/* ------------------------------------------------------------------ tools */
const measuring = () => state.tool !== "select";

function setTool(tool) {
  if (state.tool !== tool) { state.draft = null; state.calibPts = null; state.cursor = null; state.snap = null; }
  state.tool = tool;
  $("stage").dataset.tool = tool;
  document.querySelectorAll(".tool[data-tool]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.tool === tool ? "true" : "false"));
  $("calib-form").hidden = true;
  updateHint();
  drawOverlay();
  updateReadout();
}
function updateHint() {
  const key = { select: "hint_select", length: "hint_length", area: "hint_area", count: "hint_count", calibrate: "hint_calibrate" }[state.tool];
  $("hint-text").textContent = t(key);
  $("hint-actions").hidden = !(state.draft && state.draft.points.length);
  if ($("undo-btn")) updateHistoryButtons();
}
function toPt(src) {
  const r = $("overlay").getBoundingClientRect();
  return [clamp((src.clientX - r.left) / state.zoom, 0, state.pageSize.w), clamp((src.clientY - r.top) / state.zoom, 0, state.pageSize.h)];
}
/** Locks the direction from `last` to p to the nearest of 0°, 45°, 90°... */
function constrain(p, last) {
  const dx = p[0] - last[0], dy = p[1] - last[1];
  const step = Math.PI / 4;
  const ang = Math.round(Math.atan2(dy, dx) / step) * step;
  const ux = Math.cos(ang), uy = Math.sin(ang);
  const len = dx * ux + dy * uy;
  return [last[0] + ux * len, last[1] + uy * len];
}
/** Where a click at this pointer position lands: snapped, then angle-locked with Shift. */
function resolvePoint(src, last, exclude) {
  let p = toPt(src), snap = null;
  if (state.snapOn && !src.altKey && state.tool !== "count") {
    snap = findSnap(p, exclude);
    if (snap) p = [snap.x, snap.y];
  }
  if (src.shiftKey && last) p = constrain(p, last);
  return { p, snap };
}
const lastDraftPoint = () => {
  if (state.tool === "calibrate") return state.calibPts && state.calibPts.length === 1 ? state.calibPts[0] : null;
  const d = state.draft;
  return d && d.points.length && d.type !== "count" ? d.points[d.points.length - 1] : null;
};

/** Pointer moved over the sheet (or a modifier key changed): update cursor, snap marker and readout. */
function onMove(src) {
  lastPtr = { clientX: src.clientX, clientY: src.clientY, shiftKey: !!src.shiftKey, altKey: !!src.altKey };
  if (!measuring() || !state.pdf) {
    if (state.snap || state.cursor) { state.snap = null; state.cursor = null; drawLive(); }
    updateReadout();
    return;
  }
  const r = resolvePoint(lastPtr, lastDraftPoint());
  state.cursor = r.p; state.snap = r.snap;
  drawLive();
  updateReadout();
}

function addPoint(evt) {
  const { p } = resolvePoint(evt, lastDraftPoint());
  if (state.tool === "calibrate") {
    if (!state.calibPts || state.calibPts.length >= 2) state.calibPts = [];
    state.calibPts.push(p);
    if (state.calibPts.length === 2) { $("calib-form").hidden = false; $("calib-value").value = ""; $("calib-value").focus(); }
    drawLive(); updateReadout();
    return;
  }
  if (!state.draft) state.draft = { type: state.tool, points: [] };
  const pts = state.draft.points;
  // clicking the first corner again closes an area
  if (state.tool === "area" && pts.length >= 3 && dist(p, pts[0]) < 9 / state.zoom) { finishDraft(); return; }
  pts.push(p);
  updateHint();
  drawLive(); updateReadout();
}

function finishDraft() {
  const d = state.draft;
  if (!d) return;
  // drop repeated points left behind by a double-click
  const pts = d.points.filter((p, i) => i === 0 || d.type === "count" || dist(p, d.points[i - 1]) > 1.5 / state.zoom);
  if (d.type === "area" && pts.length > 3 && dist(pts[0], pts[pts.length - 1]) <= 1.5 / state.zoom) pts.pop();
  const min = { length: 2, area: 3, count: 1 }[d.type];
  state.draft = null; state.cursor = null;
  if (pts.length >= min) {
    pushHistory();
    state.counters[d.type] = (state.counters[d.type] || 0) + 1;
    const item = {
      id: "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type: d.type, name: t("name_" + d.type, { n: state.counters[d.type] }),
      page: state.pageNum, points: pts, status: "draft", origin: "manual",
    };
    state.items.push(item);
    state.selectedId = item.id;
    save();
    renderRows();
    const input = document.querySelector(`.rowi[data-id="${item.id}"] input.name`);
    if (input) { input.focus(); input.select(); }
  }
  updateHint();
  drawOverlay(); updateReadout();
}
function cancelDraft() {
  state.draft = null; state.calibPts = null; state.cursor = null; state.snap = null;
  $("calib-form").hidden = true;
  updateHint();
  drawOverlay(); updateReadout();
}
function undoPoint() {
  if (state.draft && state.draft.points.length) {
    state.draft.points.pop();
    if (!state.draft.points.length) state.draft = null;
    updateHint();
    if (lastPtr && overSheet) onMove(lastPtr); else { drawLive(); updateReadout(); }
  }
}

/* ------------------------------------------------------------------ scale */
function buildPresets() {
  const box = $("presets");
  if (!box) return;
  box.textContent = "";
  const list = state.unitSystem === "imperial"
    ? [["1/2″ = 1′", 24], ["1/4″ = 1′", 48], ["3/16″ = 1′", 64], ["1/8″ = 1′", 96], ["1″ = 10′", 120], ["1″ = 20′", 240]]
    : [["1:20", 20], ["1:50", 50], ["1:100", 100], ["1:200", 200], ["1:500", 500], ["1:1000", 1000]];
  for (const [label, ratio] of list) {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = label; b.dataset.label = label; b.dataset.ratio = ratio;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => { applyScale({ mpp: ratio * M_PER_PT, label }); });
    box.appendChild(b);
  }
  if (state.pdf) updateScaleChip();
}
function applyScale(sc) {
  pushHistory();
  if ($("scale-all").checked) { state.scaleAll = sc; state.scales = {}; }
  else state.scales[state.pageNum] = sc;
  save();
  updateScaleChip(); drawOverlay(); renderRows();
}
function toggleScalePop(open) {
  const pop = $("scale-pop");
  const show = open === undefined ? pop.hidden : open;
  pop.hidden = !show;
  $("scale-btn").setAttribute("aria-expanded", show ? "true" : "false");
}

/* ------------------------------------------------------------------- rows */
const TRASH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12M10.5 10.5v6M13.5 10.5v6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function renderRows() {
  const list = $("rows");
  list.textContent = "";
  for (const item of state.items) {
    const li = document.createElement("li");
    li.className = "rowi" + (item.id === state.selectedId ? " selected" : "");
    li.dataset.id = item.id;

    const ok = document.createElement("button");
    ok.type = "button"; ok.className = "ok";
    ok.setAttribute("aria-pressed", item.status === "approved" ? "true" : "false");
    ok.title = t(item.status === "approved" ? "approved" : "approve");
    ok.setAttribute("aria-label", ok.title + ": " + item.name);
    ok.addEventListener("click", (e) => {
      e.stopPropagation();
      pushHistory();
      item.status = item.status === "approved" ? "draft" : "approved";
      save(); renderRows(); drawOverlay();
    });

    const name = document.createElement("input");
    name.className = "name"; name.type = "text"; name.value = item.name;
    name.setAttribute("aria-label", t("col_desc"));
    name.addEventListener("input", () => { item.name = name.value; save(); });
    name.addEventListener("change", () => drawOverlay());
    name.addEventListener("keydown", (e) => { if (e.key === "Enter") name.blur(); e.stopPropagation(); });
    name.addEventListener("click", (e) => { e.stopPropagation(); selectItem(item.id, false); });

    const qty = document.createElement("span");
    const q = qtyText(item);
    qty.className = "qty" + (q ? "" : " missing");
    qty.textContent = q || t("scale_needed");

    const del = document.createElement("button");
    del.type = "button"; del.className = "del"; del.innerHTML = TRASH;
    del.title = t("delete"); del.setAttribute("aria-label", t("delete") + ": " + item.name);
    del.addEventListener("click", (e) => { e.stopPropagation(); removeItem(item.id); });

    const meta = document.createElement("div");
    meta.className = "meta";
    const chips = [[t("page_short", { n: item.page }), ""], [t("tool_" + item.type), ""]];
    if (item.type === "area") { const per = lenText(polyLength(item.points.concat([item.points[0]])), item.page); if (per) chips.push([`${t("perimeter")} ${per}`, ""]); }
    if (item.origin === "ai") chips.push([t("origin_ai"), "ai"]);
    for (const [text, cls] of chips) {
      const c = document.createElement("span");
      c.className = "chip " + cls; c.textContent = text;
      meta.appendChild(c);
    }

    li.append(ok, name, qty, del, meta);
    li.addEventListener("click", () => selectItem(item.id, true));
    list.appendChild(li);
  }
  const total = state.items.length;
  const done = state.items.filter((i) => i.status === "approved").length;
  $("boq-empty").hidden = total > 0;
  const prog = $("progress");
  prog.textContent = total ? t("progress", { done, total }) : "";
  prog.classList.toggle("done", total > 0 && done === total);
  $("export-xlsx").disabled = !total;
  $("export-csv").disabled = !total;
}

async function selectItem(id, jump) {
  state.selectedId = id;
  const item = state.items.find((i) => i.id === id);
  document.querySelectorAll(".rowi").forEach((r) => r.classList.toggle("selected", r.dataset.id === id));
  if (item && jump && item.page !== state.pageNum) await goToPage(item.page);
  drawOverlay();
}
function removeItem(id) {
  pushHistory();
  state.items = state.items.filter((i) => i.id !== id);
  if (state.selectedId === id) state.selectedId = null;
  save(); renderRows(); drawOverlay();
}

/* ----------------------------------------------------------------- export */
function exportRows() {
  const head = ["#", t("col_desc"), t("col_unit"), t("col_qty"), t("col_method"), t("col_source"), t("col_scale"), t("col_status"), t("col_origin")];
  const rows = state.items.map((item, i) => {
    const q = measure(item);
    const sc = pageScale(item.page);
    return [
      i + 1, item.name, q.ok ? q.unit : "", q.ok ? Number(q.value.toFixed(q.decimals === 0 ? 0 : 3)) : "",
      t("tool_" + item.type), `${state.fileName}, ${t("page_short", { n: item.page })}`,
      item.type === "count" ? "" : (sc ? sc.label : ""),
      t(item.status === "approved" ? "approved" : "draft"),
      t(item.origin === "ai" ? "origin_ai" : "origin_manual"),
    ];
  });
  return [head].concat(rows);
}
const baseName = () => state.fileName.replace(/\.pdf$/i, "") || "takeoff";

function download(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function exportCsv() {
  const esc = (v) => { const s = String(v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const text = exportRows().map((r) => r.map(esc).join(",")).join("\r\n");
  download(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }), baseName() + "-BOQ.csv");
}
let xlsxLoading = null;
function loadXlsx() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (!xlsxLoading) {
    xlsxLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = VENDOR + "xlsx.mini.min.js";
      s.onload = () => resolve(window.XLSX);
      s.onerror = () => reject(new Error("xlsx"));
      document.head.appendChild(s);
    });
  }
  return xlsxLoading;
}
async function exportXlsx() {
  try {
    const XLSX = await loadXlsx();
    const ws = XLSX.utils.aoa_to_sheet(exportRows());
    ws["!cols"] = [{ wch: 5 }, { wch: 34 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 34 }, { wch: 16 }, { wch: 14 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BOQ");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    download(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), baseName() + "-BOQ.xlsx");
  } catch (e) {
    console.error(e);
    exportCsv();
  }
}

/* --------------------------------------------------------------- AI draft */
const AI_TOOL = {
  name: "submit_takeoff",
  description: "Return the measurable elements found on the drawing sheet.",
  input_schema: {
    type: "object",
    properties: {
      scale_note: { type: "string", description: "Scale printed on the sheet, e.g. 1:100, or empty if not readable." },
      areas: { type: "array", items: { type: "object", properties: { name: { type: "string" }, polygon: { type: "array", minItems: 3, items: { type: "array", minItems: 2, maxItems: 2, items: { type: "number" } } } }, required: ["name", "polygon"] } },
      lengths: { type: "array", items: { type: "object", properties: { name: { type: "string" }, polyline: { type: "array", minItems: 2, items: { type: "array", minItems: 2, maxItems: 2, items: { type: "number" } } } }, required: ["name", "polyline"] } },
      counts: { type: "array", items: { type: "object", properties: { name: { type: "string" }, points: { type: "array", minItems: 1, items: { type: "array", minItems: 2, maxItems: 2, items: { type: "number" } } } }, required: ["name", "points"] } },
    },
    required: ["scale_note", "areas", "lengths", "counts"],
  },
};
function aiSystem() {
  return [
    "You are assisting a construction estimator with quantity takeoff from a drawing.",
    "You receive an image of one drawing sheet. Identify what can be measured from it and return it by calling the submit_takeoff tool.",
    "Coordinates are pixel positions in the image you were given: origin at the top-left corner, x to the right, y down.",
    "Rules:",
    "- Trace only what is clearly drawn. Do not guess hidden or unclear elements.",
    "- Rooms, slabs and other surfaces go in areas, as closed polygons along the wall centrelines.",
    "- Wall runs go in lengths, as polylines along the wall centreline. Keep external walls and internal partitions as separate entries.",
    "- Countable items such as doors, windows, columns and fixtures go in counts, with one point at the centre of each item and one entry per item type.",
    "- Ignore title blocks, dimension lines, grid bubbles, legends and notes.",
    "- If the sheet is not a plan, or nothing can be measured reliably, return empty arrays.",
    `- Write short descriptive names in this language: ${LANG_NAMES[state.lang]}.`,
    "- In scale_note report the scale printed on the sheet if you can read it, otherwise an empty string.",
  ].join("\n");
}
function aiConfig() {
  try { return { key: localStorage.getItem("qtomate:apikey") || "", model: localStorage.getItem("qtomate:model") || DEFAULT_MODEL }; }
  catch (e) { return { key: "", model: DEFAULT_MODEL }; }
}
function openSettings() {
  const cfg = aiConfig();
  $("ai-key").value = cfg.key;
  $("ai-model").value = cfg.model;
  $("settings").showModal();
}

async function aiDraft() {
  const cfg = aiConfig();
  if (!cfg.key) { toast(t("ai_need_key")); openSettings(); return; }
  const btn = $("ai-btn");
  btn.classList.add("busy");
  toast(t("ai_working"));
  const pageNum = state.pageNum;
  try {
    const page = await state.pdf.getPage(pageNum);
    const vp1 = page.getViewport({ scale: 1 });
    const rs = 1568 / Math.max(vp1.width, vp1.height);
    const vp = page.getViewport({ scale: rs });
    const off = document.createElement("canvas");
    off.width = Math.round(vp.width); off.height = Math.round(vp.height);
    const ctx = off.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, off.width, off.height);
    await page.render({ canvas: off, canvasContext: ctx, viewport: vp }).promise;
    const b64 = off.toDataURL("image/png").split(",")[1];

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": cfg.key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: 8000,
        system: aiSystem(),
        tools: [AI_TOOL],
        tool_choice: { type: "tool", name: "submit_takeoff" },
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/png", data: b64 } },
            { type: "text", text: `Image size: ${off.width} x ${off.height} pixels. Sheet: ${state.fileName}, page ${pageNum}.` },
          ],
        }],
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.error && data.error.message) || `HTTP ${res.status}`);
    const block = data && Array.isArray(data.content) ? data.content.find((b) => b.type === "tool_use") : null;
    const out = block && block.input ? block.input : null;
    if (!out) throw new Error("no result");
    pushHistory();
    const added = addAiItems(out, pageNum, rs, off.width, off.height);
    // use the scale Claude read only when the user has not set one
    let scaleMsg = "";
    const m = /1\s*[:/]\s*(\d{1,5})/.exec(String(out.scale_note || ""));
    if (m && !pageScale(pageNum)) {
      const ratio = Number(m[1]);
      if (ratio >= 1) { state.scales[pageNum] = { mpp: ratio * M_PER_PT, label: "1:" + ratio }; scaleMsg = " " + t("ai_scale", { s: "1:" + ratio }); }
    }
    save(); updateScaleChip(); renderRows(); drawOverlay();
    toast(added ? t("ai_done", { n: added }) + scaleMsg : t("ai_none"));
  } catch (e) {
    console.error(e);
    toast(t("ai_error", { msg: e && e.message ? e.message : String(e) }), true);
  } finally {
    btn.classList.remove("busy");
  }
}

function addAiItems(out, pageNum, rs, W, H) {
  const conv = (arr) => (Array.isArray(arr) ? arr : [])
    .filter((p) => Array.isArray(p) && p.length >= 2 && isFinite(p[0]) && isFinite(p[1]))
    .map((p) => [clamp(Number(p[0]), 0, W) / rs, clamp(Number(p[1]), 0, H) / rs]);
  let n = 0;
  const push = (type, name, pts, min) => {
    if (pts.length < min) return;
    state.counters[type] = (state.counters[type] || 0) + 1;
    state.items.push({
      id: "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + n,
      type, name: String(name || t("name_" + type, { n: state.counters[type] })).slice(0, 120),
      page: pageNum, points: pts, status: "draft", origin: "ai",
    });
    n++;
  };
  for (const a of out.areas || []) push("area", a.name, conv(a.polygon), 3);
  for (const l of out.lengths || []) push("length", l.name, conv(l.polyline), 2);
  for (const c of out.counts || []) push("count", c.name, conv(c.points), 1);
  return n;
}

/* ----------------------------------------------------------------- events */
function wire() {
  const overlay = $("overlay");
  el("g", { id: "g-items" }, overlay);
  el("g", { id: "g-live" }, overlay);
  try { state.snapOn = localStorage.getItem("qtomate:snap") !== "0"; } catch (e) { /* ignore */ }

  // language
  const langSel = $("lang");
  for (const l of LANGS) { const o = document.createElement("option"); o.value = l; o.textContent = LANG_NAMES[l]; langSel.appendChild(o); }
  langSel.addEventListener("change", () => applyLang(langSel.value));
  $("unit-system").addEventListener("change", (e) => {
    state.unitSystem = e.target.value;
    save(); buildPresets(); buildCalibUnits(); updateHint(); drawOverlay(); renderRows();
  });

  // files
  $("pick").addEventListener("click", () => $("file").click());
  $("open-other").addEventListener("click", () => $("file").click());
  $("file").addEventListener("change", (e) => { openFile(e.target.files[0]); e.target.value = ""; });
  $("sample").addEventListener("click", openSample);
  const drop = $("drop");
  window.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
  window.addEventListener("dragleave", () => drop.classList.remove("over"));
  window.addEventListener("drop", (e) => {
    e.preventDefault(); drop.classList.remove("over");
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) openFile(f);
  });

  // tools
  document.querySelectorAll(".tool[data-tool]").forEach((b) => b.addEventListener("click", () => { toggleScalePop(false); setTool(b.dataset.tool); }));
  $("scale-btn").addEventListener("click", () => toggleScalePop());
  $("scale-custom-apply").addEventListener("click", () => {
    const r = Number($("scale-custom").value);
    if (r >= 1) applyScale({ mpp: r * M_PER_PT, label: "1:" + r });
  });
  $("calibrate-btn").addEventListener("click", () => { toggleScalePop(false); setTool("calibrate"); });
  $("calib-apply").addEventListener("click", applyCalibration);
  $("calib-value").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); applyCalibration(); } e.stopPropagation(); });
  $("calib-unit").addEventListener("change", (e) => { try { localStorage.setItem("qtomate:calibunit:" + state.unitSystem, e.target.value); } catch (err) { /* ignore */ } });
  $("ai-btn").addEventListener("click", aiDraft);
  $("settings-btn").addEventListener("click", openSettings);
  $("ai-save").addEventListener("click", () => {
    try {
      const key = $("ai-key").value.trim();
      if (key) localStorage.setItem("qtomate:apikey", key); else localStorage.removeItem("qtomate:apikey");
      localStorage.setItem("qtomate:model", $("ai-model").value.trim() || DEFAULT_MODEL);
    } catch (e) { /* ignore */ }
  });
  $("ai-remove").addEventListener("click", () => {
    try { localStorage.removeItem("qtomate:apikey"); } catch (e) { /* ignore */ }
    $("ai-key").value = "";
  });
  $("snap-btn").addEventListener("click", () => setSnap(!state.snapOn));
  $("undo-btn").addEventListener("click", undo);
  $("redo-btn").addEventListener("click", redo);

  // paging and zoom
  $("prev").addEventListener("click", () => goToPage(state.pageNum - 1));
  $("next").addEventListener("click", () => goToPage(state.pageNum + 1));
  const pageInput = $("page-input");
  pageInput.addEventListener("change", () => goToPage(Number(pageInput.value)));
  pageInput.addEventListener("keydown", (e) => { if (e.key === "Enter") pageInput.blur(); e.stopPropagation(); });
  pageInput.addEventListener("focus", () => pageInput.select());
  $("zoom-in").addEventListener("click", () => setZoom(state.zoom * 1.25));
  $("zoom-out").addEventListener("click", () => setZoom(state.zoom / 1.25));
  $("zoom-fit").addEventListener("click", () => renderPage(true));
  const scroller = $("scroller");
  scroller.addEventListener("wheel", (e) => {
    // A mouse wheel zooms at the cursor, as in CAD and PDF takeoff tools. A touchpad
    // (small, two-axis deltas) keeps scrolling the sheet; pinching zooms.
    const pinch = e.ctrlKey || e.metaKey;
    const wheel = e.deltaMode !== 0 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 50);
    if (!pinch && (!wheel || e.shiftKey)) return;
    e.preventDefault();
    const step = pinch && !wheel ? Math.exp(-e.deltaY * 0.01) : (e.deltaY < 0 ? 1.2 : 1 / 1.2);
    setZoom(state.zoom * step, { x: e.clientX, y: e.clientY });
  }, { passive: false });
  scroller.addEventListener("scroll", () => { if (state.pdf) scheduleDetail(160); }, { passive: true });

  // drawing
  let pan = null;
  const startPan = (e) => {
    pan = { x: e.clientX, y: e.clientY, left: scroller.scrollLeft, top: scroller.scrollTop };
    scroller.classList.add("panning");
    overlay.setPointerCapture(e.pointerId);
  };
  overlay.addEventListener("mousedown", (e) => { if (e.button === 1) e.preventDefault(); });
  let lastDown = null;
  overlay.addEventListener("pointerdown", (e) => {
    if (e.button === 1 || (e.button === 0 && spaceDown)) { e.preventDefault(); startPan(e); return; }
    if (e.button !== 0) return;
    // Double-clicks are detected here: the overlay is redrawn between the two clicks,
    // so the browser's own dblclick event is not reliable on it.
    const now = performance.now();
    const dbl = !!lastDown && now - lastDown.t < 400 && Math.hypot(e.clientX - lastDown.x, e.clientY - lastDown.y) < 5;
    lastDown = dbl ? null : { t: now, x: e.clientX, y: e.clientY };
    if (state.tool === "select") {
      const g = e.target.closest ? e.target.closest("[data-id]") : null;
      const h = e.target.closest ? e.target.closest("[data-i]") : null;
      if (g && h && g.dataset.id === state.selectedId) {
        if (dbl) { removeCorner(g.dataset.id, h); return; }
        edit = { id: g.dataset.id, index: Number(h.dataset.i), insert: h.classList.contains("mid"), moved: false };
        overlay.setPointerCapture(e.pointerId);
        return;
      }
      if (g) { selectItem(g.dataset.id, false); const row = document.querySelector(`.rowi[data-id="${g.dataset.id}"]`); if (row) row.scrollIntoView({ block: "nearest" }); return; }
      startPan(e);
      return;
    }
    if (dbl && state.draft) { e.preventDefault(); finishDraft(); return; }
    addPoint(e);
  });
  let moveFrame = 0, moveEvt = null;
  overlay.addEventListener("pointermove", (e) => {
    if (pan) {
      scroller.scrollLeft = pan.left - (e.clientX - pan.x);
      scroller.scrollTop = pan.top - (e.clientY - pan.y);
      return;
    }
    overSheet = true;
    moveEvt = { clientX: e.clientX, clientY: e.clientY, shiftKey: e.shiftKey, altKey: e.altKey };
    if (moveFrame) return;
    moveFrame = requestAnimationFrame(() => {
      moveFrame = 0;
      if (edit) dragCorner(moveEvt); else onMove(moveEvt);
    });
  });
  overlay.addEventListener("pointerenter", () => { overSheet = true; });
  overlay.addEventListener("pointerleave", () => {
    if (pan || edit) return;
    overSheet = false;
    if (state.snap || state.cursor) { state.snap = null; state.cursor = null; drawLive(); }
    updateReadout();
  });
  const endPointer = (e) => {
    if (pan) { pan = null; scroller.classList.remove("panning"); }
    if (edit) {
      const moved = edit.moved;
      edit = null; state.snap = null;
      if (moved) { save(); renderRows(); }
      drawOverlay();
    }
    try { overlay.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  };
  overlay.addEventListener("pointerup", endPointer);
  overlay.addEventListener("pointercancel", endPointer);
  overlay.addEventListener("dblclick", (e) => { if (state.draft) { e.preventDefault(); finishDraft(); } });
  $("finish-draft").addEventListener("click", finishDraft);
  $("cancel-draft").addEventListener("click", cancelDraft);
  $("undo-point").addEventListener("click", undoPoint);

  const TOOL_KEYS = { KeyV: "select", KeyL: "length", KeyA: "area", KeyC: "count" };
  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    if ($("settings").open) return;
    if (e.key === "Shift" || e.key === "Alt") { if (lastPtr && overSheet) onMove({ clientX: lastPtr.clientX, clientY: lastPtr.clientY, shiftKey: e.shiftKey, altKey: e.altKey }); if (e.key === "Alt" && overSheet) e.preventDefault(); return; }
    if (e.key === "Escape") { if (!$("scale-pop").hidden) toggleScalePop(false); else if (state.draft || state.calibPts) cancelDraft(); else if (state.tool !== "select") setTool("select"); return; }
    if (typing || !state.pdf) return;
    if (e.ctrlKey || e.metaKey) {
      if (e.code === "KeyZ") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      else if (e.code === "KeyY") { e.preventDefault(); redo(); }
      return;
    }
    if (e.altKey) return;
    if (e.code === "Space" && overSheet) { e.preventDefault(); spaceDown = true; $("stage").classList.add("space"); return; }
    if (e.key === "Enter" && state.draft) { e.preventDefault(); finishDraft(); return; }
    if (e.key === "Backspace" || e.key === "Delete") {
      if (state.draft) { e.preventDefault(); undoPoint(); }
      else if (state.selectedId) { e.preventDefault(); removeItem(state.selectedId); }
      return;
    }
    if (TOOL_KEYS[e.code]) { toggleScalePop(false); setTool(TOOL_KEYS[e.code]); if (lastPtr && overSheet) onMove(lastPtr); return; }
    if (e.code === "KeyS") { setSnap(!state.snapOn); return; }
    if (e.key === "+" || e.key === "=") { setZoom(state.zoom * 1.25); return; }
    if (e.key === "-") { setZoom(state.zoom / 1.25); return; }
    if (e.key === "0") { renderPage(true); return; }
    if (e.key === "PageDown") { e.preventDefault(); goToPage(state.pageNum + 1); return; }
    if (e.key === "PageUp") { e.preventDefault(); goToPage(state.pageNum - 1); }
  });
  document.addEventListener("keyup", (e) => {
    if (e.code === "Space" && spaceDown) { spaceDown = false; $("stage").classList.remove("space"); e.preventDefault(); return; }
    if ((e.key === "Shift" || e.key === "Alt") && lastPtr && overSheet) onMove({ clientX: lastPtr.clientX, clientY: lastPtr.clientY, shiftKey: e.shiftKey, altKey: e.altKey });
  });
  window.addEventListener("blur", () => { spaceDown = false; $("stage").classList.remove("space"); });

  // export
  $("export-xlsx").addEventListener("click", exportXlsx);
  $("export-csv").addEventListener("click", exportCsv);

  let resizeTimer = 0;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (state.pdf) { drawOverlay(); scheduleDetail(0); } }, 150); });
  updateSnapButton();
}

/** Double-click on a corner of the selected measurement removes that corner. */
function removeCorner(id, handle) {
  if (handle.classList.contains("mid")) return;
  const item = state.items.find((i) => i.id === id);
  const min = item ? { length: 2, area: 3, count: 1 }[item.type] : 0;
  if (!item || item.points.length <= min) return;
  pushHistory();
  item.points.splice(Number(handle.dataset.i), 1);
  save(); renderRows(); drawOverlay();
}

/** Moves the corner being dragged; the first movement records an undo step. */
function dragCorner(src) {
  if (!edit) return;
  const item = state.items.find((i) => i.id === edit.id);
  if (!item) { edit = null; return; }
  lastPtr = { clientX: src.clientX, clientY: src.clientY, shiftKey: !!src.shiftKey, altKey: !!src.altKey };
  const at = item.type === "count" ? Object.assign({}, lastPtr, { altKey: true }) : lastPtr; // count marks do not snap
  const r = resolvePoint(at, null, edit.insert ? null : { id: item.id, index: edit.index });
  if (!edit.moved) {
    pushHistory();
    if (edit.insert) { item.points.splice(edit.index, 0, r.p); edit.insert = false; }
    edit.moved = true;
  }
  item.points[edit.index] = r.p;
  state.snap = item.type === "count" ? null : r.snap;
  drawOverlay();
  const cell = document.querySelector(`.rowi[data-id="${item.id}"] .qty`);
  const q = qtyText(item);
  if (cell && q) cell.textContent = q;
}

const CALIB_UNITS = {
  metric: [["mm", 0.001, "unit_mm"], ["cm", 0.01, "unit_cm"], ["m", 1, "unit_m"]],
  imperial: [["ft", 1 / FT_PER_M, "unit_ft"], ["in", 1 / FT_PER_M / 12, "unit_in"]],
};
function buildCalibUnits() {
  const sel = $("calib-unit");
  if (!sel) return;
  let saved = null;
  try { saved = localStorage.getItem("qtomate:calibunit:" + state.unitSystem); } catch (e) { /* ignore */ }
  sel.textContent = "";
  for (const [id, , key] of CALIB_UNITS[state.unitSystem]) {
    const o = document.createElement("option");
    o.value = id; o.textContent = t(key);
    sel.appendChild(o);
  }
  if (saved && CALIB_UNITS[state.unitSystem].some((u) => u[0] === saved)) sel.value = saved;
}

function applyCalibration() {
  const v = Number($("calib-value").value);
  if (!(v > 0) || !state.calibPts || state.calibPts.length < 2) return;
  const d = dist(state.calibPts[0], state.calibPts[1]);
  if (d < 1e-6) return;
  const unit = CALIB_UNITS[state.unitSystem].find((u) => u[0] === $("calib-unit").value) || CALIB_UNITS[state.unitSystem][0];
  const mpp = (v * unit[1]) / d;
  const ratio = mpp / M_PER_PT;
  applyScale({ mpp, label: `${t("scale_calibrated")} ≈ 1:${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}` });
  setTool("select");
  // drawings are rarely outside this range: most likely the distance was typed in another unit
  if (ratio > 5000 || ratio < 1) toast(t("calib_warn", { r: Math.round(ratio), u: t(unit[2]) }), true);
}

wire();
applyLang(pickLang());
// expose a small handle for automated checks
window.__qtomate = { state, measure, openSample, findSnap };
