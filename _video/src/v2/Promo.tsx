import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {COPY, Lang, Lines} from './i18n';
import {PLAN_BOX, Plan} from './Plan';
import {ACCENT, BG, DISPLAY, FG, LINE, MONO, SANS, T, clamp01, draw, fmt, measure} from './theme';

export type PromoProps = {lang: Lang};

const SC = Object.fromEntries(T.scenes.map((s) => [s.id, s]));
const EXIT = 7;
const WEIGHT = 700;
const TRACK = -0.02; // letter-spacing, em
const LangCtx = React.createContext<Lang>('en');
const useLang = () => React.useContext(LangCtx);
const useLayout = () => {
  const {width, height} = useVideoConfig();
  return {W: width, H: height, vertical: height > width};
};

// ---------- лист чертежа: сетка, рамка, штамп ----------
const Paper: React.FC = () => {
  const frame = useCurrentFrame();
  const lang = useLang();
  const {W, vertical} = useLayout();
  const sheet = T.scenes.filter((s) => frame >= s.start).length;
  const busy = ['scan', 'approve'].includes(T.scenes[sheet - 1].id);
  const m = vertical ? 28 : 36;
  const zones = vertical ? 4 : 8;
  const drift = frame * 0.25;
  const [lSheet, lScale] = COPY.sheetLabels[lang];
  const cell = (k: string, v: string, border: React.CSSProperties) => (
    <div style={{padding: '6px 12px', ...border}}>
      <div style={{fontSize: 12, opacity: 0.7}}>{k}</div>
      <div style={{fontSize: 20, color: FG}}>{v}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <AbsoluteFill
        style={{
          backgroundImage: [
            'linear-gradient(rgba(163,179,210,0.10) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(163,179,210,0.10) 1px, transparent 1px)',
            'linear-gradient(rgba(163,179,210,0.04) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(163,179,210,0.04) 1px, transparent 1px)',
          ].join(','),
          backgroundSize: '120px 120px, 120px 120px, 24px 24px, 24px 24px',
          backgroundPosition: `${drift}px ${drift}px`,
        }}
      />
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, ${ACCENT}1c 0%, transparent 50%)`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)'}} />
      <div style={{position: 'absolute', inset: m, border: `2px solid ${LINE}55`}} />
      <div style={{position: 'absolute', inset: m + 10, border: `1px solid ${LINE}33`}} />
      {Array.from({length: zones}, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', top: m - 2, left: m + ((W - 2 * m) / zones) * (i + 0.5),
            fontFamily: MONO, fontSize: 14, color: `${LINE}88`, transform: 'translate(-50%, -100%)',
          }}
        >
          {i + 1}
        </div>
      ))}
      <div
        style={{
          position: 'absolute', right: m + 10, bottom: m + 10, width: vertical ? 560 : 540,
          border: `1px solid ${LINE}66`, fontFamily: MONO, color: `${LINE}cc`, background: `${BG}dd`,
          opacity: busy ? 0 : 1,
        }}
      >
        <div style={{display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', borderBottom: `1px solid ${LINE}66`}}>
          <div style={{padding: '10px 14px', borderRight: `1px solid ${LINE}66`, fontFamily: DISPLAY, fontWeight: 700, fontSize: 26, color: FG}}>
            <span style={{color: ACCENT}}>Qto</span>Mate
          </div>
          {cell(lSheet, `A-101 · ${sheet}/${T.scenes.length}`, {borderRight: `1px solid ${LINE}66`})}
          {cell(lScale, '1:100', {})}
        </div>
        <div style={{padding: '6px 14px', fontSize: 13}}>{COPY.sample[lang]}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- кинетический текст ----------
const Letter: React.FC<{char: string; index: number; seed: string; color: string; stagger: number}> = ({char, index, seed, color, stagger}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const delay = index * stagger;
  const p = spring({frame: frame - delay, fps, config: {damping: 12, stiffness: 170, mass: 0.6}});
  const dir = random(seed + 'd') > 0.5 ? 1 : -1;
  const y = interpolate(p, [0, 1], [200 + random(seed + 'y') * 200, 0]) * dir;
  const x = interpolate(p, [0, 1], [(random(seed + 'x') - 0.5) * 420, 0]);
  const rot = interpolate(p, [0, 1], [(random(seed + 'r') - 0.5) * 120, 0]);
  const scale = interpolate(p, [0, 1], [2.6, 1]);
  const blur = interpolate(p, [0, 0.7], [20, 0], clamp01);
  const opacity = interpolate(frame - delay, [0, 4], [0, 1], clamp01);
  return (
    <span
      style={{
        display: 'inline-block', color, opacity, whiteSpace: 'pre',
        filter: `blur(${blur}px)`,
        transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`,
      }}
    >
      {char}
    </span>
  );
};

// размерная линия под ключевым словом
const DimUnder: React.FC<{p: number; label?: string; fontSize: number}> = ({p, label, fontSize}) => {
  const tick = 0.12 * fontSize;
  const y = fontSize * 0.1;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: '100%', height: fontSize * 0.42, opacity: p > 0 ? 1 : 0}}>
      {[0, 1].map((side) => (
        <React.Fragment key={side}>
          <div style={{position: 'absolute', [side ? 'right' : 'left']: 0, top: -fontSize * 0.08, width: 2.5, height: fontSize * 0.28, background: ACCENT, opacity: p}} />
          <div
            style={{
              position: 'absolute', top: y - 1, [side ? 'right' : 'left']: -tick / 2,
              width: tick, height: 4, background: ACCENT, transform: `rotate(-45deg) scaleX(${p})`,
            }}
          />
        </React.Fragment>
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: y, height: 3, background: ACCENT, transform: `scaleX(${p})`, boxShadow: `0 0 24px ${ACCENT}`}} />
      {label ? (
        <div
          style={{
            position: 'absolute', left: 0, right: 0, top: y + 10, textAlign: 'center', fontFamily: MONO,
            fontSize: Math.max(22, fontSize * 0.16), letterSpacing: 2, color: ACCENT,
            opacity: interpolate(p, [0.5, 1], [0, 1], clamp01),
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};

const GAP = 0.3; // межсловный пробел, em

const Kinetic: React.FC<{lines: Lines; size?: number; stagger?: number; seed: string; maxWidth?: number}> = ({
  lines, size, stagger = 1.4, seed, maxWidth,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {W, H, vertical} = useLayout();
  // размер шрифта подбирается по реальной ширине самой длинной строки
  const widthAt100 = Math.max(
    ...lines.map((l) => l.reduce((acc, w, i) => acc + measure(w.text, 100, WEIGHT, DISPLAY, TRACK) + (i ? GAP * 100 : 0), 0)),
  );
  const base = size ?? (vertical ? W * 0.17 : H * 0.17);
  const fontSize = Math.min(base, ((maxWidth ?? W * 0.84) * 100) / widthAt100);
  const total = lines.flat().map((w) => w.text).join('').length;
  const dimP = spring({frame: frame - total * stagger - 6, fps, config: {damping: 18, stiffness: 120}});
  let idx = 0;
  return (
    <div style={{fontFamily: DISPLAY, fontWeight: WEIGHT, fontSize, lineHeight: 1.12, letterSpacing: `${TRACK}em`, textAlign: 'center'}}>
      {lines.map((line, li) => (
        <div key={li} style={{whiteSpace: 'nowrap', marginBottom: line.some((w) => w.key && w.dim) ? fontSize * 0.36 : 0}}>
          {line.map((w, wi) => (
            <React.Fragment key={wi}>
              {wi > 0 ? <span style={{display: 'inline-block', width: `${GAP}em`}} /> : null}
              <span style={{position: 'relative', display: 'inline-block'}}>
                {w.text.split('').map((c, ci) => (
                  <Letter key={ci} char={c} index={idx++} seed={`${seed}-${li}-${wi}-${ci}`} color={w.key ? ACCENT : FG} stagger={stagger} />
                ))}
                {w.key ? <DimUnder p={dimP} label={w.dim} fontSize={fontSize} /> : null}
              </span>
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
};

// ---------- обёртка сцены: уход с зумом и размытием ----------
const SceneWrap: React.FC<{dur: number; last?: boolean; children: React.ReactNode}> = ({dur, last, children}) => {
  const frame = useCurrentFrame();
  const exitP = last ? 0 : interpolate(frame, [dur - EXIT, dur], [0, 1], {...clamp01, easing: Easing.in(Easing.cubic)});
  const push = interpolate(frame, [0, dur], [1, 1.05]);
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center', alignItems: 'center',
        transform: `scale(${push * (1 + exitP * 0.5)})`, filter: `blur(${exitP * 16}px)`, opacity: 1 - exitP * 0.5,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

type Box = {x: number; y: number; w: number; h: number};
const PlanSvg: React.FC<{width: number; box?: Box; children: React.ReactNode}> = ({width, box = PLAN_BOX, children}) => (
  <svg viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} width={width} height={(width * box.h) / box.w} style={{overflow: 'visible'}}>
    {children}
  </svg>
);

const pick = (c: {h: Lines; v?: Lines}, vertical: boolean) => (vertical && c.v ? c.v : c.h);

// ---------- сцены ----------
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const lang = useLang();
  const {H, vertical} = useLayout();
  return (
    <SceneWrap dur={SC.hook.dur}>
      <AbsoluteFill
        style={{
          justifyContent: 'center', alignItems: 'center', opacity: 0.55,
          transform: `scale(${interpolate(frame, [0, SC.hook.dur], [1.12, 1.0])}) rotate(${vertical ? -93 : -3}deg)`,
        }}
      >
        <PlanSvg width={vertical ? H * 0.8 : H * 1.25}>
          <Plan lang={lang} f={frame} speed={1.6} idPrefix="hook" />
        </PlanSvg>
      </AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at center, ${BG}ee 0%, ${BG}aa 35%, transparent 70%)`}} />
      <Kinetic seed="hook" lines={pick(COPY.hook[lang], vertical)} />
    </SceneWrap>
  );
};

const TextScene: React.FC<{id: 'manual' | 'measure' | 'excel'}> = ({id}) => {
  const lang = useLang();
  const {vertical} = useLayout();
  return (
    <SceneWrap dur={SC[id].dur}>
      {id === 'excel' ? <SheetGrid /> : null}
      <Kinetic seed={id} lines={pick(COPY[id][lang], vertical)} />
    </SceneWrap>
  );
};

// таблица, которая прорисовывается за словом Excel
const SheetGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const {W, H} = useLayout();
  const cols = 7;
  const rows = 9;
  const w = Math.min(W, H) * 1.1;
  const h = w * 0.62;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: 0.35}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {Array.from({length: rows + 1}, (_, i) => {
          const p = draw(frame, i * 1.2, 12);
          return <line key={`r${i}`} x1={0} y1={(h / rows) * i} x2={w * p} y2={(h / rows) * i} stroke={i === 1 ? ACCENT : LINE} strokeWidth={i === 1 ? 2.5 : 1} />;
        })}
        {Array.from({length: cols + 1}, (_, i) => {
          const p = draw(frame, 4 + i * 1.2, 12);
          return <line key={`c${i}`} x1={(w / cols) * i} y1={0} x2={(w / cols) * i} y2={h * p} stroke={LINE} strokeWidth={1} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

const Scan: React.FC = () => {
  const frame = useCurrentFrame();
  const lang = useLang();
  const {W, H, vertical} = useLayout();
  const scanX = interpolate(frame, [T.scan.from, T.scan.to], [T.scan.x0, T.scan.x1], {...clamp01, easing: Easing.inOut(Easing.sin)});
  const box: Box = vertical ? {x: 20, y: 0, w: 1260, h: 1430} : {x: 20, y: 0, w: 1880, h: 900};
  const svgW = vertical ? W * 0.92 : Math.min(W * 0.9, (H * 0.72 * box.w) / box.h);
  return (
    <SceneWrap dur={SC.scan.dur}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: vertical ? 40 : 24, marginTop: vertical ? -40 : -20}}>
        <Kinetic seed="scan" stagger={0.7} size={vertical ? W * 0.075 : H * 0.06} lines={pick(COPY.scan[lang], vertical)} />
        <PlanSvg width={svgW} box={box}>
          <Plan lang={lang} f={frame} speed={2.4} scanX={scanX} callouts={vertical ? 'v' : 'h'} calloutF={frame} idPrefix="scan" />
        </PlanSvg>
      </div>
    </SceneWrap>
  );
};

const Approve: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lang = useLang();
  const {W, H, vertical} = useLayout();
  const A = T.approve;
  const units = COPY.units[lang];
  const byKey = Object.fromEntries(T.callouts.map((c) => [c.key, c]));
  const done = A.order.filter((_, j) => frame >= A.firstTick + j * A.tickEvery).length;
  const panelW = vertical ? W * 0.88 : Math.min(W * 0.66, 1240);
  const fs = vertical ? 36 : 36;
  return (
    <SceneWrap dur={SC.approve.dur}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: vertical ? 60 : 40}}>
        <Kinetic seed="approve" size={vertical ? W * 0.13 : H * 0.1} lines={pick(COPY.approve[lang], vertical)} />
        <div
          style={{
            width: panelW, border: `1px solid ${LINE}55`, background: 'rgba(255,255,255,0.045)', borderRadius: 18,
            overflow: 'hidden', fontFamily: SANS, color: FG,
            opacity: interpolate(frame, [A.rowsIn - 8, A.rowsIn], [0, 1], clamp01),
            transform: `translateY(${interpolate(frame, [A.rowsIn - 8, A.rowsIn], [40, 0], {...clamp01, easing: Easing.out(Easing.cubic)})}px)`,
          }}
        >
          <div style={{padding: '20px 26px', borderBottom: `1px solid ${LINE}33`}}>
            <div style={{fontFamily: DISPLAY, fontWeight: 600, fontSize: fs * 0.8}}>{COPY.boqTitle[lang]}</div>
            <div style={{fontSize: fs * 0.62, color: LINE, marginTop: 6}}>{COPY.boqSrc[lang]}</div>
          </div>
          {A.order.map((key, j) => {
            const c = byKey[key];
            const tickAt = A.firstTick + j * A.tickEvery;
            const t = spring({frame: frame - tickAt, fps, config: {damping: 12, stiffness: 220}});
            const rowIn = draw(frame, A.rowsIn + j * 2, 8);
            return (
              <div
                key={key}
                style={{
                  display: 'flex', alignItems: 'center', gap: 20, padding: '16px 26px', fontSize: fs,
                  borderBottom: j < A.order.length - 1 ? `1px solid ${LINE}22` : undefined,
                  background: `rgba(232,116,79,${0.1 * t})`, opacity: rowIn, transform: `translateX(${(1 - rowIn) * 30}px)`,
                }}
              >
                <div
                  style={{
                    width: fs * 1.1, height: fs * 1.1, borderRadius: '50%', flex: 'none',
                    border: `2.5px solid ${t > 0.05 ? ACCENT : `${LINE}88`}`, background: t > 0.05 ? ACCENT : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.3 * Math.sin(Math.PI * Math.min(t, 1))})`,
                  }}
                >
                  <svg width={fs * 0.6} height={fs * 0.6} viewBox="0 0 20 20">
                    <path d="M3 10.5 L8 15 L17 5" fill="none" stroke={BG} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(t, 1)} />
                  </svg>
                </div>
                <div style={{flex: 1}}>{COPY.rows[lang][key]}</div>
                <div
                  style={{
                    fontSize: fs * 0.55, fontFamily: MONO, color: ACCENT, border: `1.5px solid ${ACCENT}`, borderRadius: 999,
                    padding: '3px 12px', opacity: t, transform: `scale(${0.6 + 0.4 * t})`,
                  }}
                >
                  {COPY.approved[lang]}
                </div>
                <div style={{fontFamily: DISPLAY, fontWeight: 600, minWidth: fs * 4.6, textAlign: 'right'}}>
                  {fmt(c.value, c.decimals, COPY.dec[lang])} <span style={{color: LINE, fontFamily: SANS, fontSize: fs * 0.8}}>{units[c.unit]}</span>
                </div>
              </div>
            );
          })}
          <div style={{padding: '14px 26px', fontFamily: MONO, fontSize: fs * 0.62, color: done === A.order.length ? ACCENT : LINE, borderTop: `1px solid ${LINE}33`}}>
            {done === A.order.length ? COPY.allApproved[lang] : `${done} / ${A.order.length}`}
          </div>
        </div>
      </div>
    </SceneWrap>
  );
};

const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lang = useLang();
  const {W, H, vertical} = useLayout();
  // кегль логотипа подбирается так, чтобы слово занимало не больше 84% ширины кадра
  const fs = Math.min(vertical ? W * 0.17 : H * 0.2, (W * 0.84 * 100) / measure('QtoMate', 100, 800, DISPLAY));
  const textW = measure('QtoMate', fs, 800, DISPLAY);
  const outline = draw(frame, 4, 30);
  const fill = interpolate(frame, [28, 40], [0, 1], clamp01);
  const guides = draw(frame, 0, 16);
  const sub = spring({frame: frame - 42, fps, config: {damping: 16}});
  const url = interpolate(frame, [56, 66], [0, 1], clamp01);
  const capH = fs * 0.72;
  return (
    <SceneWrap dur={SC.logo.dur} last>
      <div style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <svg width={textW} height={fs * 1.25} viewBox={`0 ${-fs * 1.05} ${textW} ${fs * 1.25}`} style={{overflow: 'visible'}}>
          {/* построительные линии */}
          {([[0, LINE], [-capH, LINE], [fs * 0.2, `${LINE}66`]] as const).map(([y, c], i) => (
            <line key={i} x1={-W} y1={y} x2={-W + (2 * W + textW) * guides} y2={y} stroke={c} strokeWidth={1.5} strokeDasharray="14 8" opacity={0.6 * (1 - fill * 0.5)} />
          ))}
          <line x1={0} y1={-fs * 0.98 * guides} x2={0} y2={fs * 0.3} stroke={`${LINE}88`} strokeWidth={1.5} />
          <line x1={textW} y1={-fs * 0.98 * guides} x2={textW} y2={fs * 0.3} stroke={`${LINE}88`} strokeWidth={1.5} />
          <g opacity={guides}>
            <line x1={0} y1={-fs * 0.9} x2={textW * outline} y2={-fs * 0.9} stroke={ACCENT} strokeWidth={2.5} />
            <text x={textW / 2} y={-fs * 0.9 - 14} fill={ACCENT} fontFamily={MONO} fontSize={vertical ? 24 : 26} textAnchor="middle" opacity={outline}>
              QTO · Quantity Take-Off
            </text>
          </g>
          <text x={0} y={0} fontFamily={DISPLAY} fontWeight={800} fontSize={fs} strokeWidth={3} strokeDasharray={2400} strokeDashoffset={2400 * (1 - outline)}>
            <tspan stroke={ACCENT} fill={ACCENT} fillOpacity={fill}>Qto</tspan>
            <tspan stroke={FG} fill={FG} fillOpacity={fill}>Mate</tspan>
          </text>
        </svg>
        <div
          style={{
            fontFamily: SANS, fontWeight: 500, fontSize: vertical ? W * 0.058 : H * 0.05, color: FG, marginTop: fs * 0.12,
            maxWidth: vertical ? W * 0.84 : W * 0.7, textAlign: 'center', lineHeight: 1.25,
            opacity: sub, transform: `translateY(${(1 - sub) * 40}px)`,
          }}
        >
          {COPY.tagline[lang]}
        </div>
        <div style={{marginTop: vertical ? 50 : 36, fontFamily: MONO, fontSize: vertical ? 34 : 30, color: ACCENT, letterSpacing: 1, opacity: url}}>
          qtomate.dpdns.org
        </div>
      </div>
    </SceneWrap>
  );
};

const SCENE_COMPONENTS: Record<string, React.FC> = {
  hook: Hook,
  manual: () => <TextScene id="manual" />,
  measure: () => <TextScene id="measure" />,
  scan: Scan,
  approve: Approve,
  excel: () => <TextScene id="excel" />,
  logo: Logo,
};

// ---------- вспышка и тряска на стыках ----------
const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  const white = interpolate(frame, [0, 2, 7], [1, 0.8, 0], clamp01);
  const tint = interpolate(frame, [0, 3, 12], [0.7, 0.4, 0], clamp01);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: ACCENT, opacity: tint, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle, #fff 0%, #fff 35%, rgba(255,255,255,0.5) 80%)', opacity: white}} />
    </AbsoluteFill>
  );
};

const useShake = () => {
  const frame = useCurrentFrame();
  const s = T.scenes.find((sc) => sc.start > 0 && frame >= sc.start && frame < sc.start + 8);
  if (!s) return {x: 0, y: 0};
  const amp = 26 * (1 - (frame - s.start) / 8);
  return {x: (random(`sx${frame}`) - 0.5) * 2 * amp, y: (random(`sy${frame}`) - 0.5) * 2 * amp};
};

export const Promo: React.FC<PromoProps> = ({lang}) => {
  const shake = useShake();
  return (
    <LangCtx.Provider value={lang}>
      <AbsoluteFill style={{backgroundColor: BG}}>
        <AbsoluteFill style={{transform: `translate(${shake.x}px, ${shake.y}px)`}}>
          <Paper />
          {T.scenes.map((s) => {
            const C = SCENE_COMPONENTS[s.id];
            return (
              <Sequence key={s.id} from={s.start} durationInFrames={s.dur}>
                <C />
              </Sequence>
            );
          })}
        </AbsoluteFill>
        {T.scenes.map((s) => (
          <Sequence key={`f${s.id}`} from={s.start} durationInFrames={14}>
            <Flash />
          </Sequence>
        ))}
        <Audio src={staticFile('qtomate_sfx.wav')} />
      </AbsoluteFill>
    </LangCtx.Provider>
  );
};
