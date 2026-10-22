import React from 'react';
import {Easing, interpolate, spring, useVideoConfig} from 'remotion';
import {COPY, Lang} from './i18n';
import {ACCENT, BG, DISPLAY, FG, LINE, MONO, SANS, T, clamp01, draw, fmt} from './theme';

// Лист A-101 с сайта (12 × 8 м, три помещения), координаты сайта × 2: 80 ед. = 1 м
type Seg = [number, number, number, number];
const OUTER: Seg[] = [
  [140, 120, 1100, 120],
  [1100, 120, 1100, 760],
  [1100, 760, 424, 760],
  [352, 760, 140, 760],
  [140, 760, 140, 120],
];
const INNER: Seg[] = [
  [700, 120, 700, 244],
  [700, 316, 700, 580],
  [700, 652, 700, 760],
  [700, 480, 1100, 480],
];
const DOOR_R = 72;
const DOORS = [
  {cx: 352, cy: 760, a0: -90, a1: 0},
  {cx: 700, cy: 244, a0: 180, a1: 90},
  {cx: 700, cy: 652, a0: 180, a1: 270},
];
const WINDOWS: Seg[] = [
  [320, 120, 448, 120],
  [840, 120, 968, 120],
  [1100, 236, 1100, 364],
  [1100, 556, 1100, 684],
];
const COLUMNS = [[140, 120], [700, 120], [1100, 120], [140, 760], [700, 760], [1100, 760], [1100, 480]];
const ROOMS = [
  {x: 420, y: 432, a: 56.0},
  {x: 900, y: 292, a: 22.5},
  {x: 900, y: 612, a: 17.5},
];
const AXES_X = [{v: 140, l: 'A'}, {v: 700, l: 'B'}, {v: 1100, l: 'C'}];
const AXES_Y = [{v: 120, l: '1'}, {v: 480, l: '2'}, {v: 760, l: '3'}];

export const PLAN_BOX = {x: 20, y: 0, w: 1250, h: 900};

const pt = (cx: number, cy: number, a: number) => [cx + DOOR_R * Math.cos((a * Math.PI) / 180), cy + DOOR_R * Math.sin((a * Math.PI) / 180)];

const Ln: React.FC<{s: Seg; p: number; w: number; color: string; dash?: string; cap?: 'square' | 'butt'}> = ({
  s, p, w, color, dash, cap = 'square',
}) =>
  p <= 0 ? null : (
    <line
      x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]}
      stroke={color}
      strokeWidth={w}
      strokeLinecap={cap}
      pathLength={dash ? undefined : 1}
      strokeDasharray={dash ?? '1 1'}
      strokeDashoffset={dash ? 0 : 1 - p}
      opacity={dash ? p : 1}
    />
  );

const Dim: React.FC<{s: Seg; label: string; p: number; vertical?: boolean}> = ({s, label, p, vertical}) => {
  if (p <= 0) return null;
  const [x1, y1, x2, y2] = s;
  const tick = (x: number, y: number) => <line x1={x - 9} y1={y + 9} x2={x + 9} y2={y - 9} stroke={LINE} strokeWidth={2.5} />;
  const ext = vertical
    ? [[x1 - 30, y1, x1 + 12, y1], [x2 - 30, y2, x2 + 12, y2]]
    : [[x1, y1 - 30, x1, y1 + 12], [x2, y2 - 30, x2, y2 + 12]];
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return (
    <g opacity={0.85}>
      <Ln s={[x1, y1, x2, y2]} p={p} w={1.5} color={LINE} cap="butt" />
      {ext.map((e, i) => <Ln key={i} s={e as Seg} p={p} w={1} color={LINE} cap="butt" />)}
      <g opacity={interpolate(p, [0.6, 1], [0, 1], clamp01)}>
        {tick(x1, y1)}
        {tick(x2, y2)}
        <text
          x={vertical ? mx + 14 : mx}
          y={vertical ? my : my - 12}
          fill={LINE}
          fontFamily={MONO}
          fontSize={24}
          textAnchor="middle"
          transform={vertical ? `rotate(90 ${mx + 14} ${my})` : undefined}
        >
          {label}
        </text>
      </g>
    </g>
  );
};

export type PlanProps = {
  lang: Lang;
  f: number; // локальный кадр отрисовки
  speed?: number;
  scanX?: number | null;
  callouts?: 'h' | 'v' | null;
  calloutF?: number;
  idPrefix: string;
};

export const calloutFrame = (ax: number) =>
  T.scan.from + ((T.scan.to - T.scan.from) * (ax - T.scan.x0)) / (T.scan.x1 - T.scan.x0);

export const Plan: React.FC<PlanProps> = ({lang, f, speed = 1, scanX = null, callouts = null, calloutF = 0, idPrefix}) => {
  const {fps} = useVideoConfig();
  const k = f * speed;
  const dec = COPY.dec[lang];
  const units = COPY.units[lang];

  const walls = (color: string) => (
    <>
      {OUTER.map((s, i) => <Ln key={`o${i}`} s={s} p={draw(k, 4 + i * 3, 12)} w={16} color={color} />)}
      {INNER.map((s, i) => <Ln key={`i${i}`} s={s} p={draw(k, 16 + i * 3, 10)} w={9} color={color} />)}
    </>
  );

  return (
    <g>
      <defs>
        <pattern id={`${idPrefix}hatch`} width={18} height={18} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={18} stroke={ACCENT} strokeWidth={2.5} opacity={0.5} />
        </pattern>
        <clipPath id={`${idPrefix}scan`}>
          <rect x={-200} y={-200} width={Math.max(0, (scanX ?? -200) + 200)} height={1400} />
        </clipPath>
        <linearGradient id={`${idPrefix}trail`} x1="0" x2="1">
          <stop offset="0" stopColor={ACCENT} stopOpacity={0} />
          <stop offset="1" stopColor={ACCENT} stopOpacity={0.35} />
        </linearGradient>
        <filter id={`${idPrefix}glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* оси */}
      {AXES_X.map((a, i) => (
        <g key={`ax${i}`} opacity={draw(k, i * 2, 8)}>
          <Ln s={[a.v, 72, a.v, 800]} p={draw(k, i * 2, 10)} w={1} color={LINE} dash="24 6 4 6" />
          <circle cx={a.v} cy={46} r={24} fill="none" stroke={LINE} strokeWidth={1.5} />
          <text x={a.v} y={55} fill={LINE} fontFamily={MONO} fontSize={24} textAnchor="middle">{a.l}</text>
        </g>
      ))}
      {AXES_Y.map((a, i) => (
        <g key={`ay${i}`} opacity={draw(k, 2 + i * 2, 8)}>
          <Ln s={[84, a.v, 1150, a.v]} p={draw(k, 2 + i * 2, 10)} w={1} color={LINE} dash="24 6 4 6" />
          <circle cx={56} cy={a.v} r={24} fill="none" stroke={LINE} strokeWidth={1.5} />
          <text x={56} y={a.v + 9} fill={LINE} fontFamily={MONO} fontSize={24} textAnchor="middle">{a.l}</text>
        </g>
      ))}

      {walls(FG)}

      {COLUMNS.map(([x, y], i) => (
        <rect key={`c${i}`} x={x - 14} y={y - 14} width={28} height={28} fill={FG} opacity={draw(k, 30 + i, 4)} />
      ))}

      {WINDOWS.map((s, i) => {
        const p = draw(k, 32 + i * 1.5, 6);
        if (p <= 0) return null;
        const horiz = s[1] === s[3];
        const [x1, y1, x2, y2] = s;
        const off = (d: number): Seg => (horiz ? [x1, y1 + d, x2, y2 + d] : [x1 + d, y1, x2 + d, y2]);
        return (
          <g key={`w${i}`}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={BG} strokeWidth={18} />
            <Ln s={off(-8)} p={p} w={2} color={LINE} cap="butt" />
            <Ln s={off(0)} p={p} w={2} color={LINE} cap="butt" />
            <Ln s={off(8)} p={p} w={2} color={LINE} cap="butt" />
          </g>
        );
      })}

      {DOORS.map((d, i) => {
        const p = draw(k, 36 + i * 2, 8);
        if (p <= 0) return null;
        const [lx, ly] = pt(d.cx, d.cy, d.a0);
        const [ex, ey] = pt(d.cx, d.cy, d.a1);
        const sweep = d.a1 > d.a0 ? 1 : 0;
        return (
          <g key={`d${i}`}>
            <Ln s={[d.cx, d.cy, lx, ly]} p={p} w={3} color={LINE} cap="butt" />
            <path
              d={`M ${lx} ${ly} A ${DOOR_R} ${DOOR_R} 0 0 ${sweep} ${ex} ${ey}`}
              fill="none" stroke={LINE} strokeWidth={1.5} strokeDasharray="1 1" pathLength={1} strokeDashoffset={1 - p}
            />
          </g>
        );
      })}

      <Dim s={[140, 840, 1100, 840]} label="12 000" p={draw(k, 42, 10)} />
      <Dim s={[1190, 120, 1190, 480]} label="4 500" p={draw(k, 44, 8)} vertical />
      <Dim s={[1190, 480, 1190, 760]} label="3 500" p={draw(k, 46, 8)} vertical />
      {ROOMS.map((r, i) => (
        <g key={`r${i}`} opacity={draw(k, 48 + i * 2, 6)} textAnchor="middle">
          <text x={r.x} y={r.y - 8} fill={LINE} fontFamily={SANS} fontWeight={500} fontSize={28}>{COPY.rooms[lang][i]}</text>
          <line x1={r.x - 70} y1={r.y + 4} x2={r.x + 70} y2={r.y + 4} stroke={LINE} strokeWidth={1.5} />
          <text x={r.x} y={r.y + 34} fill={LINE} fontFamily={MONO} fontSize={24}>{fmt(r.a, 1, dec)} {units.u_m2}</text>
        </g>
      ))}

      {/* скан: распознанные элементы подсвечиваются */}
      {scanX !== null && (
        <>
          <g clipPath={`url(#${idPrefix}scan)`}>
            <rect x={140} y={120} width={960} height={640} fill={`url(#${idPrefix}hatch)`} />
            <g filter={`url(#${idPrefix}glow)`}>{walls(ACCENT)}</g>
          </g>
          {scanX > T.scan.x0 && scanX < T.scan.x1 && (
            <g>
              <rect x={scanX - 180} y={0} width={180} height={900} fill={`url(#${idPrefix}trail)`} />
              <line x1={scanX} y1={0} x2={scanX} y2={900} stroke={ACCENT} strokeWidth={5} filter={`url(#${idPrefix}glow)`} />
              <line x1={scanX} y1={0} x2={scanX} y2={900} stroke="#fff" strokeWidth={1.5} />
            </g>
          )}
        </>
      )}

      {callouts && T.callouts.map((c, i) => {
        const local = calloutF - calloutFrame(c.ax);
        if (local < 0) return null;
        const pop = spring({frame: local, fps, config: {damping: 11, stiffness: 180}});
        const count = interpolate(local, [0, 18], [0, c.value], {...clamp01, easing: Easing.out(Easing.cubic)});
        const item = callouts === 'h'
          ? {x: 1330, y: 40 + i * 165}
          : {x: 20 + (i % 2) * 640, y: 960 + Math.floor(i / 2) * 175};
        const lead = draw(local, 2, 10);
        return (
          <g key={`co${i}`}>
            {callouts === 'h' && (
              <polyline
                points={`${c.ax},${c.ay} ${1270},${item.y + 40} ${1315},${item.y + 40}`}
                fill="none" stroke={ACCENT} strokeWidth={2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - lead}
              />
            )}
            <g transform={`translate(${c.ax} ${c.ay}) scale(${pop})`}>
              <circle r={26} fill={BG} stroke={ACCENT} strokeWidth={3} />
              <text y={9} fill={ACCENT} fontFamily={MONO} fontSize={26} textAnchor="middle" fontWeight={700}>{i + 1}</text>
            </g>
            <g transform={`translate(${item.x + (1 - pop) * 60} ${item.y})`} opacity={interpolate(local, [0, 6], [0, 1], clamp01)}>
              <circle cx={22} cy={40} r={20} fill="none" stroke={ACCENT} strokeWidth={2.5} />
              <text x={22} y={48} fill={ACCENT} fontFamily={MONO} fontSize={22} textAnchor="middle">{i + 1}</text>
              <text x={60} y={24} fill={LINE} fontFamily={SANS} fontWeight={500} fontSize={30}>{COPY.rows[lang][c.key]}</text>
              <text x={60} y={98} fill={FG} fontFamily={DISPLAY} fontWeight={700} fontSize={66}>
                {fmt(count, c.decimals, dec)}
                <tspan fill={ACCENT} fontFamily={SANS} fontWeight={600} fontSize={42} dx={14}>{units[c.unit]}</tspan>
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
};
