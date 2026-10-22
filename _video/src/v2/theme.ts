import {continueRender, delayRender, interpolate, staticFile} from 'remotion';
import timing from '../timing.json';

export const T = timing;
// Цвета фона и линий как на сайте (--bg, --text, --muted), акцент — оранжевый ролика
export const BG = '#080d1a';
export const ACCENT = '#E8744F';
export const FG = '#eaf0ff';
export const LINE = '#a3b3d2';
export const DISPLAY = 'Unbounded';
export const SANS = 'Onest';
export const MONO = 'QM Mono';

// Шрифты сайта (fonts/*.woff2), с теми же поднаборами, что и в _build/build.py
const RANGES: Record<string, string> = {
  'cyrillic-ext': 'U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F',
  cyrillic: 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
  'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
  latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
};

const FACES: FontFace[] = [];
for (const [family, stem] of [[DISPLAY, 'unbounded'], [SANS, 'onest']]) {
  for (const [subset, unicodeRange] of Object.entries(RANGES)) {
    FACES.push(new FontFace(family, `url(${staticFile(`${stem}-${subset}-wght-normal.woff2`)}) format("woff2")`, {weight: '100 900', unicodeRange}));
  }
}
FACES.push(new FontFace(MONO, `url(${staticFile('DejaVuSansMono.ttf')}) format("truetype")`));

const fontHandle = delayRender('fonts', {timeoutInMilliseconds: 120000});
Promise.all(FACES.map((f) => f.load().then((loaded) => document.fonts.add(loaded))))
  .then(() => document.fonts.ready)
  .catch((err) => console.error('font load failed', err))
  .finally(() => continueRender(fontHandle));

// ширина строки в пикселях при заданном размере (после загрузки шрифтов)
let ctx: CanvasRenderingContext2D | null = null;
export const measure = (text: string, size: number, weight = 700, family = DISPLAY, letterSpacingEm = 0) => {
  ctx ??= document.createElement('canvas').getContext('2d');
  ctx!.font = `${weight} ${size}px "${family}"`;
  return ctx!.measureText(text).width + letterSpacingEm * size * text.length;
};

export const clamp01 = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const draw = (f: number, start: number, dur: number) => interpolate(f, [start, start + dur], [0, 1], clamp01);

export const fmt = (v: number, decimals: number, dec = ',') => {
  const [int, frac] = v.toFixed(decimals).split('.');
  const spaced = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return frac ? `${spaced}${dec}${frac}` : spaced;
};
