// QtoMate takeoff workspace.
// Everything runs in the browser. The PDF is never uploaded; only "AI draft"
// sends an image of the current page to the Anthropic API with the user's own key.
import * as pdfjsLib from "./vendor/pdf.min.mjs";
import { LANGS, LANG_NAMES, makeT } from "./i18n.js";

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
};
let t = makeT("en");
let renderTask = null;
let renderSeq = 0;

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
  document.querySelectorAll("[data-i18n-title]").forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
  $("home-link").href = lang === "en" ? "../" : `../${lang}/`;
  $("lang").value = lang;
  buildPresets();
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
async function renderPage(fit) {
  const seq = ++renderSeq;
  const page = await state.pdf.getPage(state.pageNum);
  if (seq !== renderSeq) return;
  const vp1 = page.getViewport({ scale: 1 });
  state.pageSize = { w: vp1.width, h: vp1.height };
  const scroller = $("scroller");
  if (fit) {
    const z = Math.min((scroller.clientWidth - 48) / vp1.width, (scroller.clientHeight - 48) / vp1.height);
    state.zoom = clamp(z || 1, 0.1, 8);
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let rs = state.zoom * dpr;
  const maxPixels = 24e6;
  if (vp1.width * vp1.height * rs * rs > maxPixels) rs = Math.sqrt(maxPixels / (vp1.width * vp1.height));
  const vp = page.getViewport({ scale: rs });
  const canvas = $("canvas");
  if (renderTask) { try { renderTask.cancel(); } catch (e) { /* ignore */ } }
  canvas.width = Math.floor(vp.width);
  canvas.height = Math.floor(vp.height);
  const cssW = vp1.width * state.zoom, cssH = vp1.height * state.zoom;
  canvas.style.width = cssW + "px"; canvas.style.height = cssH + "px";
  const overlay = $("overlay");
  overlay.setAttribute("viewBox", `0 0 ${vp1.width} ${vp1.height}`);
  $("sheet").style.width = cssW + "px"; $("sheet").style.height = cssH + "px";
  $("zoom-label").textContent = Math.round(state.zoom * 100) + "%";
  updatePageLabel(); updateScaleChip(); drawOverlay();
  renderTask = page.render({ canvas, canvasContext: canvas.getContext("2d"), viewport: vp });
  try { await renderTask.promise; } catch (e) { if (e && e.name !== "RenderingCancelledException") console.error(e); }
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function updatePageLabel() {
  $("page-label").textContent = t("page_of", { n: state.pageNum, total: state.pageCount });
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
  n = clamp(n, 1, state.pageCount);
  if (n === state.pageNum) return;
  cancelDraft();
  state.pageNum = n;
  await renderPage(true);
}
let zoomTimer = 0;
function setZoom(z, anchor) {
  const scroller = $("scroller");
  const old = state.zoom;
  z = clamp(z, 0.1, 8);
  if (Math.abs(z - old) < 1e-4) return;
  const rect = scroller.getBoundingClientRect();
  const ax = anchor ? anchor.x - rect.left : rect.width / 2;
  const ay = anchor ? anchor.y - rect.top : rect.height / 2;
  const sheet = $("sheet").getBoundingClientRect();
  const px = (anchor ? anchor.x : rect.left + ax) - sheet.left; // position on sheet in css px
  const py = (anchor ? anchor.y : rect.top + ay) - sheet.top;
  state.zoom = z;
  const k = z / old;
  const cssW = state.pageSize.w * z, cssH = state.pageSize.h * z;
  $("canvas").style.width = cssW + "px"; $("canvas").style.height = cssH + "px";
  $("sheet").style.width = cssW + "px"; $("sheet").style.height = cssH + "px";
  $("zoom-label").textContent = Math.round(z * 100) + "%";
  const sheet2 = $("sheet").getBoundingClientRect();
  scroller.scrollLeft += (sheet2.left + px * k) - (rect.left + ax);
  scroller.scrollTop += (sheet2.top + py * k) - (rect.top + ay);
  drawOverlay();
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

function drawOverlay() {
  const svg = $("overlay");
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const z = state.zoom;
  for (const item of state.items) {
    if (item.page !== state.pageNum) continue;
    const cls = ["item", item.origin === "ai" ? "ai" : "", item.status === "approved" ? "approved" : "", item.id === state.selectedId ? "selected" : ""].join(" ");
    const g = el("g", { class: cls, "data-id": item.id }, svg);
    if (item.type === "length") {
      el("polyline", { class: "shape length", points: ptsAttr(item.points) }, g);
      el("polyline", { class: "hit", points: ptsAttr(item.points) }, g);
    } else if (item.type === "area") {
      el("polygon", { class: "shape area", points: ptsAttr(item.points) }, g);
    } else {
      for (const p of item.points) el("circle", { class: "dot", cx: p[0], cy: p[1], r: 6.5 / z }, g);
    }
    const q = qtyText(item);
    if (q) {
      const a = labelAnchor(item);
      const txt = el("text", { class: "label", x: a[0], y: a[1], "font-size": 13 / z, "text-anchor": item.type === "count" ? "start" : "middle" }, g);
      txt.textContent = item.type === "count" ? `${item.name}: ${q}` : q;
    }
  }
  // draft in progress
  const d = state.draft;
  if (d && d.points.length) {
    const pts = state.cursor ? d.points.concat([state.cursor]) : d.points;
    if (d.type === "area" && pts.length >= 3) el("polygon", { class: "draft", points: ptsAttr(pts) }, svg);
    else if (d.type !== "count") el("polyline", { class: "draft", points: ptsAttr(pts), fill: "none" }, svg);
    for (const p of d.points) el("circle", { class: "draft-dot", cx: p[0], cy: p[1], r: (d.type === "count" ? 6.5 : 4) / z }, svg);
  }
  if (state.calibPts && state.calibPts.length) {
    const pts = state.calibPts.length === 1 && state.cursor ? state.calibPts.concat([state.cursor]) : state.calibPts;
    el("polyline", { class: "draft", points: ptsAttr(pts), fill: "none" }, svg);
    for (const p of state.calibPts) el("circle", { class: "draft-dot", cx: p[0], cy: p[1], r: 4 / z }, svg);
  }
}

/* ------------------------------------------------------------------ tools */
function setTool(tool) {
  if (state.tool !== tool) { state.draft = null; state.calibPts = null; state.cursor = null; }
  state.tool = tool;
  $("stage").dataset.tool = tool;
  document.querySelectorAll(".tool[data-tool]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.tool === tool ? "true" : "false"));
  $("calib-form").hidden = true;
  updateHint();
  drawOverlay();
}
function updateHint() {
  const key = { select: "hint_select", length: "hint_length", area: "hint_area", count: "hint_count", calibrate: "hint_calibrate" }[state.tool];
  $("hint-text").textContent = t(key);
  $("hint-actions").hidden = !(state.draft && state.draft.points.length);
  $("calib-unit").textContent = t(state.unitSystem === "imperial" ? "unit_ft" : "unit_m");
}
function toPt(evt) {
  const r = $("overlay").getBoundingClientRect();
  return [clamp((evt.clientX - r.left) / state.zoom, 0, state.pageSize.w), clamp((evt.clientY - r.top) / state.zoom, 0, state.pageSize.h)];
}
function ortho(p, last) {
  return Math.abs(p[0] - last[0]) >= Math.abs(p[1] - last[1]) ? [p[0], last[1]] : [last[0], p[1]];
}

function addPoint(evt) {
  let p = toPt(evt);
  if (state.tool === "calibrate") {
    if (!state.calibPts || state.calibPts.length >= 2) state.calibPts = [];
    if (evt.shiftKey && state.calibPts.length === 1) p = ortho(p, state.calibPts[0]);
    state.calibPts.push(p);
    if (state.calibPts.length === 2) { $("calib-form").hidden = false; $("calib-value").value = ""; $("calib-value").focus(); }
    drawOverlay();
    return;
  }
  if (!state.draft) state.draft = { type: state.tool, points: [] };
  const pts = state.draft.points;
  if (evt.shiftKey && pts.length && state.tool !== "count") p = ortho(p, pts[pts.length - 1]);
  // clicking the first corner again closes an area
  if (state.tool === "area" && pts.length >= 3 && dist(p, pts[0]) < 9 / state.zoom) { finishDraft(); return; }
  pts.push(p);
  updateHint();
  drawOverlay();
}

function finishDraft() {
  const d = state.draft;
  if (!d) return;
  // drop repeated points left behind by a double-click
  const pts = d.points.filter((p, i) => i === 0 || d.type === "count" || dist(p, d.points[i - 1]) > 1.5 / state.zoom);
  const min = { length: 2, area: 3, count: 1 }[d.type];
  state.draft = null; state.cursor = null;
  if (pts.length >= min) {
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
  drawOverlay();
}
function cancelDraft() {
  state.draft = null; state.calibPts = null; state.cursor = null;
  $("calib-form").hidden = true;
  updateHint();
  drawOverlay();
}
function undoPoint() {
  if (state.draft && state.draft.points.length) {
    state.draft.points.pop();
    if (!state.draft.points.length) state.draft = null;
    updateHint();
    drawOverlay();
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
  // language
  const langSel = $("lang");
  for (const l of LANGS) { const o = document.createElement("option"); o.value = l; o.textContent = LANG_NAMES[l]; langSel.appendChild(o); }
  langSel.addEventListener("change", () => applyLang(langSel.value));
  $("unit-system").addEventListener("change", (e) => {
    state.unitSystem = e.target.value;
    save(); buildPresets(); updateHint(); drawOverlay(); renderRows();
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

  // paging and zoom
  $("prev").addEventListener("click", () => goToPage(state.pageNum - 1));
  $("next").addEventListener("click", () => goToPage(state.pageNum + 1));
  $("zoom-in").addEventListener("click", () => setZoom(state.zoom * 1.25));
  $("zoom-out").addEventListener("click", () => setZoom(state.zoom / 1.25));
  $("zoom-fit").addEventListener("click", () => renderPage(true));
  $("scroller").addEventListener("wheel", (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    setZoom(state.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), { x: e.clientX, y: e.clientY });
  }, { passive: false });

  // drawing
  const overlay = $("overlay");
  let pan = null;
  overlay.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    if (state.tool === "select") {
      const g = e.target.closest ? e.target.closest("[data-id]") : null;
      if (g) { selectItem(g.dataset.id, false); const row = document.querySelector(`.rowi[data-id="${g.dataset.id}"]`); if (row) row.scrollIntoView({ block: "nearest" }); return; }
      const sc = $("scroller");
      pan = { x: e.clientX, y: e.clientY, left: sc.scrollLeft, top: sc.scrollTop };
      sc.classList.add("panning");
      overlay.setPointerCapture(e.pointerId);
      return;
    }
    addPoint(e);
  });
  overlay.addEventListener("pointermove", (e) => {
    if (pan) {
      const sc = $("scroller");
      sc.scrollLeft = pan.left - (e.clientX - pan.x);
      sc.scrollTop = pan.top - (e.clientY - pan.y);
      return;
    }
    const active = (state.draft && state.draft.points.length && state.draft.type !== "count") || (state.calibPts && state.calibPts.length === 1);
    if (!active) return;
    let p = toPt(e);
    const last = state.draft ? state.draft.points[state.draft.points.length - 1] : state.calibPts[0];
    if (e.shiftKey) p = ortho(p, last);
    state.cursor = p;
    drawOverlay();
  });
  const endPan = (e) => {
    if (!pan) return;
    pan = null;
    $("scroller").classList.remove("panning");
    try { overlay.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  };
  overlay.addEventListener("pointerup", endPan);
  overlay.addEventListener("pointercancel", endPan);
  overlay.addEventListener("dblclick", (e) => { if (state.draft) { e.preventDefault(); finishDraft(); } });
  $("finish-draft").addEventListener("click", finishDraft);
  $("cancel-draft").addEventListener("click", cancelDraft);
  $("undo-point").addEventListener("click", undoPoint);

  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    if ($("settings").open) return;
    if (e.key === "Escape") { if (!$("scale-pop").hidden) toggleScalePop(false); else if (state.draft || state.calibPts) cancelDraft(); else if (state.tool !== "select") setTool("select"); return; }
    if (typing) return;
    if (e.key === "Enter" && state.draft) { e.preventDefault(); finishDraft(); return; }
    if (e.key === "Backspace" || e.key === "Delete") {
      if (state.draft) { e.preventDefault(); undoPoint(); }
      else if (state.selectedId) { e.preventDefault(); removeItem(state.selectedId); }
    }
  });

  // export
  $("export-xlsx").addEventListener("click", exportXlsx);
  $("export-csv").addEventListener("click", exportCsv);

  let resizeTimer = 0;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (state.pdf) drawOverlay(); }, 150); });
}

function applyCalibration() {
  const v = Number($("calib-value").value);
  if (!(v > 0) || !state.calibPts || state.calibPts.length < 2) return;
  const d = dist(state.calibPts[0], state.calibPts[1]);
  if (d < 1e-6) return;
  const metres = state.unitSystem === "imperial" ? v / FT_PER_M : v;
  const mpp = metres / d;
  applyScale({ mpp, label: `${t("scale_calibrated")} ≈ 1:${Math.round(mpp / M_PER_PT)}` });
  setTool("select");
}

wire();
applyLang(pickLang());
// expose a small handle for automated checks
window.__qtomate = { state, measure, openSample };
