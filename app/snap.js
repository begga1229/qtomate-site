// QtoMate snap index.
// Reads the vector geometry of a PDF page (the lines the drawing is made of) and
// answers "what real point of the drawing is under the cursor?": a line end,
// a midpoint, a crossing of two lines, or the nearest point on a line.
// All coordinates are page points in the viewer's own space (top-left origin,
// page rotation already applied), the same space the measurements are stored in.

const CELL = 48; // grid cell size in points
const MAX_SEGMENTS = 1500000;
const CURVE_STEPS = 8;

const mul = (m, n) => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];

// segment flags
const F_START = 1; // first point is a real end of a drawn line
const F_END = 2; // second point is a real end of a drawn line
const F_MID = 4; // the midpoint is meaningful (straight line, not a piece of a curve)

class SegmentStore {
  constructor() {
    this.n = 0;
    this.xy = new Float32Array(4 * 4096);
    this.flags = new Uint8Array(4096);
  }
  add(x1, y1, x2, y2, flags) {
    if (this.n >= MAX_SEGMENTS) return false;
    if (this.n === this.flags.length) {
      const xy = new Float32Array(this.xy.length * 2); xy.set(this.xy); this.xy = xy;
      const fl = new Uint8Array(this.flags.length * 2); fl.set(this.flags); this.flags = fl;
    }
    const o = this.n * 4;
    this.xy[o] = x1; this.xy[o + 1] = y1; this.xy[o + 2] = x2; this.xy[o + 3] = y2;
    this.flags[this.n++] = flags;
    return true;
  }
}

/** Walks the page's drawing operators and collects every painted line. */
function collect(opList, OPS, base, w, h) {
  const store = new SegmentStore();
  let ctm = base;
  const stack = [];
  const fn = opList.fnArray, args = opList.argsArray;
  const closing = new Set([OPS.closeStroke, OPS.closeFillStroke, OPS.closeEOFillStroke]);
  const inside = (x, y) => x > -4 && y > -4 && x < w + 4 && y < h + 4;
  let full = false;

  const line = (x1, y1, x2, y2, flags) => {
    if (!inside(x1, y1) && !inside(x2, y2)) return;
    if (!(isFinite(x1) && isFinite(y1) && isFinite(x2) && isFinite(y2))) return;
    if (!store.add(x1, y1, x2, y2, flags)) full = true;
  };

  for (let i = 0; i < fn.length && !full; i++) {
    const op = fn[i];
    if (op === OPS.save || op === OPS.beginGroup) { stack.push(ctm); continue; }
    if (op === OPS.restore || op === OPS.endGroup || op === OPS.paintFormXObjectEnd) { if (stack.length) ctm = stack.pop(); continue; }
    if (op === OPS.transform) { ctm = mul(ctm, args[i]); continue; }
    if (op === OPS.paintFormXObjectBegin) {
      stack.push(ctm);
      const m = args[i] && args[i][0];
      if (m && m.length === 6) ctm = mul(ctm, m);
      continue;
    }
    if (op !== OPS.constructPath) continue;
    const a = args[i];
    const paint = a[0];
    if (paint === OPS.endPath) continue; // not painted: used only for clipping
    const d = a[1] && a[1][0];
    if (!d || typeof d.length !== "number") continue;
    const A = ctm[0], B = ctm[1], C = ctm[2], D = ctm[3], E = ctm[4], F = ctm[5];
    let cx = 0, cy = 0, sx = 0, sy = 0, open = false;
    const close = () => { if (open && (cx !== sx || cy !== sy)) line(cx, cy, sx, sy, F_START | F_END | F_MID); cx = sx; cy = sy; };
    for (let k = 0; k < d.length;) {
      const c = d[k++];
      if (c === 0) { // moveTo
        const x = d[k++], y = d[k++];
        cx = sx = A * x + C * y + E; cy = sy = B * x + D * y + F; open = true;
      } else if (c === 1) { // lineTo
        const x = d[k++], y = d[k++];
        const nx = A * x + C * y + E, ny = B * x + D * y + F;
        line(cx, cy, nx, ny, F_START | F_END | F_MID);
        cx = nx; cy = ny;
      } else if (c === 2 || c === 3) { // cubic or quadratic curve, flattened
        let x1, y1, x2, y2, x3, y3;
        if (c === 2) { x1 = d[k++]; y1 = d[k++]; x2 = d[k++]; y2 = d[k++]; x3 = d[k++]; y3 = d[k++]; }
        else { const qx = d[k++], qy = d[k++]; x3 = d[k++]; y3 = d[k++]; x1 = x2 = qx; y1 = y2 = qy; }
        const p1x = A * x1 + C * y1 + E, p1y = B * x1 + D * y1 + F;
        const p2x = A * x2 + C * y2 + E, p2y = B * x2 + D * y2 + F;
        const p3x = A * x3 + C * y3 + E, p3y = B * x3 + D * y3 + F;
        let px = cx, py = cy;
        for (let s = 1; s <= CURVE_STEPS; s++) {
          const t = s / CURVE_STEPS, u = 1 - t;
          let qx, qy;
          if (c === 2) {
            qx = u * u * u * cx + 3 * u * u * t * p1x + 3 * u * t * t * p2x + t * t * t * p3x;
            qy = u * u * u * cy + 3 * u * u * t * p1y + 3 * u * t * t * p2y + t * t * t * p3y;
          } else {
            qx = u * u * cx + 2 * u * t * p1x + t * t * p3x;
            qy = u * u * cy + 2 * u * t * p1y + t * t * p3y;
          }
          line(px, py, qx, qy, (s === 1 ? F_START : 0) | (s === CURVE_STEPS ? F_END : 0));
          px = qx; py = qy;
        }
        cx = p3x; cy = p3y;
      } else if (c === 4) { // closePath
        close();
      } else {
        break; // unknown op code: stop reading this path
      }
    }
    if (closing.has(paint)) close();
  }
  return { store, truncated: full };
}

export class SnapIndex {
  constructor(store, w, h, truncated) {
    this.count = store.n;
    this.xy = store.xy;
    this.flags = store.flags;
    this.truncated = truncated;
    this.w = w; this.h = h;
    this.cols = Math.max(1, Math.ceil(w / CELL));
    this.rows = Math.max(1, Math.ceil(h / CELL));
    this.stamp = new Uint32Array(this.count);
    this.tick = 0;
    this._build();
  }

  _cells(s, visit) {
    const o = s * 4, xy = this.xy;
    const x1 = xy[o], y1 = xy[o + 1], x2 = xy[o + 2], y2 = xy[o + 3];
    const cols = this.cols, rows = this.rows;
    const len = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(1, Math.ceil(len / (CELL / 2)));
    let last = -1;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = Math.floor((x1 + (x2 - x1) * t) / CELL), cy = Math.floor((y1 + (y2 - y1) * t) / CELL);
      if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
      const id = cy * cols + cx;
      if (id !== last) { visit(id); last = id; }
    }
  }

  _build() {
    const nCells = this.cols * this.rows;
    const start = new Int32Array(nCells + 1);
    for (let s = 0; s < this.count; s++) this._cells(s, (id) => { start[id + 1]++; });
    for (let c = 0; c < nCells; c++) start[c + 1] += start[c];
    const items = new Int32Array(start[nCells]);
    const fill = start.slice(0, nCells);
    for (let s = 0; s < this.count; s++) this._cells(s, (id) => { items[fill[id]++] = s; });
    this.cellStart = start; this.cellItems = items;
  }

  /**
   * Best snap near (x, y). tolPoint is the radius for ends, midpoints and
   * crossings; tolLine the radius for "nearest point on a line".
   * Returns { x, y, kind, d } with kind "end" | "mid" | "int" | "line", or null.
   */
  query(x, y, tolPoint, tolLine) {
    if (!this.count) return null;
    const r = Math.max(tolPoint, tolLine);
    const cols = this.cols, rows = this.rows, xy = this.xy, flags = this.flags;
    // segments are filed under the cells their own line passes through, sampled every
    // half cell, so look one cell further out than the radius to be sure to see them
    const c0 = Math.max(0, Math.floor((x - r) / CELL) - 1), c1 = Math.min(cols - 1, Math.floor((x + r) / CELL) + 1);
    const r0 = Math.max(0, Math.floor((y - r) / CELL) - 1), r1 = Math.min(rows - 1, Math.floor((y + r) / CELL) + 1);
    const tick = ++this.tick;
    const tp2 = tolPoint * tolPoint, tl2 = tolLine * tolLine, r2 = r * r;
    let bestEnd = Infinity, ex = 0, ey = 0;
    let bestMid = Infinity, mx = 0, my = 0;
    let bestLine = Infinity, lx = 0, ly = 0;
    const near = []; // [d2, segment]
    for (let cy = r0; cy <= r1; cy++) {
      for (let cx = c0; cx <= c1; cx++) {
        const id = cy * cols + cx;
        for (let k = this.cellStart[id], end = this.cellStart[id + 1]; k < end; k++) {
          const s = this.cellItems[k];
          if (this.stamp[s] === tick) continue;
          this.stamp[s] = tick;
          const o = s * 4;
          const x1 = xy[o], y1 = xy[o + 1], x2 = xy[o + 2], y2 = xy[o + 3];
          const f = flags[s];
          let d;
          if (f & F_START) { d = (x1 - x) * (x1 - x) + (y1 - y) * (y1 - y); if (d < bestEnd) { bestEnd = d; ex = x1; ey = y1; } }
          if (f & F_END) { d = (x2 - x) * (x2 - x) + (y2 - y) * (y2 - y); if (d < bestEnd) { bestEnd = d; ex = x2; ey = y2; } }
          const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
          if ((f & F_MID) && l2 > 16 * tp2) {
            const hx = (x1 + x2) / 2, hy = (y1 + y2) / 2;
            d = (hx - x) * (hx - x) + (hy - y) * (hy - y);
            if (d < bestMid) { bestMid = d; mx = hx; my = hy; }
          }
          let t = l2 > 0 ? ((x - x1) * dx + (y - y1) * dy) / l2 : 0;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const px = x1 + t * dx, py = y1 + t * dy;
          d = (px - x) * (px - x) + (py - y) * (py - y);
          if (d < bestLine) { bestLine = d; lx = px; ly = py; }
          if (d <= r2 && l2 > 0) near.push([d, s]);
        }
      }
    }
    // crossings between the lines closest to the cursor
    let bestInt = Infinity, ix = 0, iy = 0;
    if (near.length > 1) {
      if (near.length > 40) { near.sort((p, q) => p[0] - q[0]); near.length = 40; }
      for (let i = 0; i < near.length; i++) {
        const a = near[i][1] * 4;
        const ax = xy[a], ay = xy[a + 1], adx = xy[a + 2] - ax, ady = xy[a + 3] - ay;
        for (let j = i + 1; j < near.length; j++) {
          const b = near[j][1] * 4;
          const bx = xy[b], by = xy[b + 1], bdx = xy[b + 2] - bx, bdy = xy[b + 3] - by;
          const den = adx * bdy - ady * bdx;
          if (Math.abs(den) < 1e-6 * (Math.abs(adx) + Math.abs(ady)) * (Math.abs(bdx) + Math.abs(bdy))) continue; // parallel
          const t = ((bx - ax) * bdy - (by - ay) * bdx) / den;
          const u = ((bx - ax) * ady - (by - ay) * adx) / den;
          if (t < -1e-3 || t > 1.001 || u < -1e-3 || u > 1.001) continue;
          const qx = ax + t * adx, qy = ay + t * ady;
          const d = (qx - x) * (qx - x) + (qy - y) * (qy - y);
          if (d < bestInt) { bestInt = d; ix = qx; iy = qy; }
        }
      }
    }
    // a point snap wins over "on a line"; among point snaps the nearest wins,
    // with a small preference for ends and crossings over midpoints
    let kind = null, bx = 0, by = 0, bd = Infinity;
    if (bestEnd <= tp2) { kind = "end"; bx = ex; by = ey; bd = bestEnd; }
    if (bestInt <= tp2 && bestInt < bd * 0.98) { kind = "int"; bx = ix; by = iy; bd = bestInt; }
    if (bestMid <= tp2 && bestMid * 1.6 < bd) { kind = "mid"; bx = mx; by = my; bd = bestMid; }
    if (!kind && bestLine <= tl2) { kind = "line"; bx = lx; by = ly; bd = bestLine; }
    return kind ? { x: bx, y: by, kind, d: Math.sqrt(bd) } : null;
  }
}

/** Builds the index for one page. `pdfjs` is the PDF.js module (for its OPS table). */
export async function buildSnapIndex(page, pdfjs) {
  const vp = page.getViewport({ scale: 1 });
  const opList = await page.getOperatorList();
  const { store, truncated } = collect(opList, pdfjs.OPS, vp.transform, vp.width, vp.height);
  return new SnapIndex(store, vp.width, vp.height, truncated);
}
