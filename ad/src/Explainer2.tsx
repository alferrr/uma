/**
 * Uma explainer #2. Timing and motion follow inspo2.mp4 beat for beat:
 *   word punches → 3D phone with floating props → phone bursts into option cards
 *   → ribbon strokes + pan → chosen icon grows into a full-screen wipe → fan of
 *   screens + wave + dropping words → slide-in phone → word punches → panel shrinks
 *   into the app icon → end card.
 * Look is strictly Uma's: Outfit, green #16923F, near-black #141414, white, #F4F4F1,
 * the app's own icons, and real app screens.
 */
import type { ReactNode } from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

import { Logo } from './components/Logo';
import { easeIn, easeInOut, easeOut, rise } from './ease';
import { loadFonts } from './fonts';
import { C, FONT, SHOT, type Layout } from './theme';

loadFonts();

export const TOTAL_FRAMES_2 = 840;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const lerp = (f: number, a: number[], b: number[], easing = easeInOut) =>
  interpolate(f, a, b, { easing, ...clamp });

// Timeline (30 fps), matched to inspo2 at 10 fps.
const T = {
  plants: 0,
  drying: 22,
  out: 44,
  zones: 66,
  toCheck: 90,
  toCheckOut: 118,
  phoneIn: 124,
  phoneSettled: 164,
  headline: 158,
  props: 168,
  burst: 218,
  ribbon1: 252,
  pan: 328,
  ribbon2: 326,
  wipe: 360,
  fanIn: 374,
  wave: 420,
  fanWords: 440,
  fanOut: 506,
  slide: 510,
  slideWords: 534,
  scan: 615,
  check: 633,
  done: 652,
  shrink: 668,
  iconIn: 688,
  toEnd: 712,
  endText: 730,
};

const FAN = ['home.png', 'map.png', 'zone.png', 'checkin.png', 'profile-synced.png'];
const CHECK = 'M5 12.5l4.5 4.5L19 7.5';
const DROP = 'M12 3.5c3.6 4.3 5.5 7.4 5.5 10a5.5 5.5 0 0 1-11 0c0-2.6 1.9-5.7 5.5-10Z';

// ─── Shared pieces ───

function Phone({ src, width }: { src: string; width: number }) {
  const h = (width * SHOT.h) / SHOT.w;
  const b = width * 0.035;
  return (
    <div
      style={{
        padding: b,
        borderRadius: width * 0.13 + b,
        background: '#1B1B1A',
        boxShadow: '0 40px 90px rgba(20,20,20,0.24), 0 10px 26px rgba(20,20,20,0.12)',
      }}
    >
      <div
        style={{
          width,
          height: h,
          borderRadius: width * 0.13,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        <Img src={staticFile(`screens/${src}`)} style={{ width, height: h, display: 'block' }} />
      </div>
    </div>
  );
}

/** Copies along the direction of motion: a clean motion blur for fast moves. */
function Trail({ dx = 0, dy = 0, children }: { dx?: number; dy?: number; children: ReactNode }) {
  const speed = Math.hypot(dx, dy);
  const n = speed > 5 ? 6 : 1;
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <AbsoluteFill
          key={i}
          style={{
            transform: `translate(${-dx * i * 0.4}px, ${-dy * i * 0.4}px)`,
            opacity: n === 1 ? 1 : i === 0 ? 0.6 : 0.4 / (i + 1),
          }}
        >
          {children}
        </AbsoluteFill>
      ))}
    </>
  );
}

/** A huge word that slides up into place with a vertical trail, on green or white. */
function Punch({
  text,
  from,
  to,
  green,
  size,
  shrinkTo = 1,
  weight = 700,
  exitAt,
}: {
  text: string;
  from: number;
  to: number;
  green: boolean;
  size: number;
  shrinkTo?: number;
  weight?: number;
  exitAt?: number;
}) {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  const ex = (t: number) =>
    exitAt === undefined ? 0 : lerp(t, [exitAt, exitAt + 12], [0, 1], easeIn);
  const y = (t: number) => lerp(t, [from, from + 6], [size * 1.1, 0], easeOut) - ex(t) * size * 1.4;
  const s = lerp(f, [from + 8, to], [1, shrinkTo]);
  return (
    <AbsoluteFill style={{ background: green ? `rgba(22,146,63,${1 - ex(f)})` : C.white }}>
      <Trail dy={y(f) - y(f - 1)}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              fontFamily: FONT,
              fontWeight: weight,
              fontSize: size,
              lineHeight: 0.98,
              letterSpacing: -size * 0.045,
              color: green ? C.white : C.text,
              textAlign: 'center',
              whiteSpace: 'pre-line',
              transform: `translateY(${y(f)}px) scale(${s * (1 - ex(f) * 0.4)})`,
              opacity: 1 - ex(f),
            }}
          >
            {text}
          </div>
        </AbsoluteFill>
      </Trail>
    </AbsoluteFill>
  );
}

/** Words dropping in one by one, each with a little blur and tilt (the reference's "pick your favorite"). */
function DropWords({
  text,
  start,
  size,
  color,
  every = 5,
}: {
  text: string;
  start: number;
  size: number;
  color: string;
  every?: number;
}) {
  const f = useCurrentFrame();
  return (
    <div style={{ display: 'flex', gap: size * 0.24, justifyContent: 'center' }}>
      {text.split(' ').map((w, i) => {
        const t = rise(f, start + i * every, 12);
        return (
          <span
            key={i}
            style={{
              fontFamily: FONT,
              fontWeight: 600,
              fontSize: size,
              letterSpacing: -size * 0.02,
              color,
              opacity: t,
              filter: `blur(${(1 - t) * 6}px)`,
              display: 'inline-block',
              transform: `translateY(${(1 - t) * -size * 0.7}px) rotate(${(1 - t) * (i % 2 ? 10 : -10)}deg)`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
}

/** Thick stroke drawing itself along a path. */
function Ribbon({
  d,
  start,
  dur,
  width,
  color = C.green,
}: {
  d: string;
  start: number;
  dur: number;
  width: number;
  color?: string;
}) {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const p = lerp(f, [start, start + dur], [0, 1], easeOut);
  if (p <= 0) return null;
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray="1 1"
        strokeDashoffset={1 - p}
      />
    </svg>
  );
}

/** An option card in Uma's style: white, green outline, the app's icon in a green circle. */
function OptionCard({
  label,
  icon,
  w,
  faded = 0,
}: {
  label: string;
  icon: string;
  w: number;
  faded?: number;
}) {
  const h = w * 0.46;
  const r = h * 0.2;
  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: h,
        borderRadius: 32,
        background: C.white,
        border: `${Math.max(4, w * 0.007)}px solid rgba(22,146,63,${1 - faded * 0.7})`,
        boxShadow: `0 24px 60px rgba(20,20,20,${0.1 * (1 - faded)})`,
        overflow: 'hidden',
      }}
    >
      {/* Large faint version of the icon on the left, like the reference's pictograms. */}
      <svg
        width={h * 1.05}
        height={h * 1.05}
        viewBox="0 0 24 24"
        style={{ position: 'absolute', left: -h * 0.12, bottom: -h * 0.12, opacity: 0.12 }}
      >
        <path
          d={icon}
          fill="none"
          stroke={C.green}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: w / 2 - r,
          top: h * 0.16,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          background: C.green,
          opacity: 1 - faded * 0.6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={r * 1.1} height={r * 1.1} viewBox="0 0 24 24">
          <path
            d={icon}
            fill="none"
            stroke="#fff"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: h * 0.16 + r * 2 + h * 0.07,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: h * 0.15,
          color: C.green,
          opacity: 1 - faded * 0.6,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── Beats ───

function PhoneBeat({ L, W, H }: { L: boolean; W: number; H: number }) {
  const f = useCurrentFrame();
  if (f < T.toCheckOut || f > T.burst + 16) return null;
  const pw = L ? 390 : 560;
  const ph = (pw * SHOT.h) / SHOT.w;
  // Dolly: the phone starts huge and close at the bottom, tilted, and settles.
  const p = lerp(f, [T.phoneIn, T.phoneSettled], [0, 1], easeOut);
  const out = lerp(f, [T.burst, T.burst + 12], [0, 1], easeIn);
  const cy = L ? H * 0.58 : H * 0.55;
  const props = [
    {
      src: 'crops/pill-pot01.png',
      w: L ? 380 : 400,
      x: L ? -0.33 : -0.3,
      y: L ? -0.05 : -0.16,
      rot: -8,
      from: [-1, 0],
    },
    {
      src: 'crops/moisture.png',
      w: L ? 360 : 380,
      x: L ? 0.33 : 0.3,
      y: L ? -0.16 : -0.24,
      rot: 7,
      from: [1, -0.4],
    },
    {
      src: 'crops/pill-z04.png',
      w: L ? 360 : 380,
      x: L ? -0.3 : -0.28,
      y: L ? 0.24 : 0.2,
      rot: 6,
      from: [-1, 0.6],
    },
    {
      src: 'crops/sync.png',
      w: L ? 460 : 460,
      x: L ? 0.31 : 0.26,
      y: L ? 0.2 : 0.28,
      rot: -5,
      from: [1, 0.5],
    },
  ];
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: C.white,
          opacity: lerp(f, [T.toCheckOut, T.toCheckOut + 10], [0, 1]),
        }}
      />
      <div style={{ position: 'absolute', top: L ? 54 : 170, left: 0, right: 0, opacity: 1 - out }}>
        <DropWords text="Uma keeps track." start={T.headline} size={L ? 92 : 96} color={C.green} />
      </div>
      <AbsoluteFill style={{ perspective: 1600 }}>
        <div
          style={{
            position: 'absolute',
            left: W / 2 - pw / 2,
            top: cy - ph / 2,
            opacity: 1 - out,
            filter: out > 0 ? `blur(${out * 16}px)` : undefined,
            transform: `translateY(${(1 - p) * H * 0.75}px) scale(${(1 + (1 - p) * 1.3) * (1 - out * 0.35)}) rotateX(${(1 - p) * 34}deg) rotateZ(${(1 - p) * -10}deg)`,
          }}
        >
          <Phone src="home.png" width={pw} />
        </div>
      </AbsoluteFill>
      {/* Real UI pieces fly in from the sides with a trail, like the reference's beans. */}
      {props.map((pr, i) => {
        const s = T.props + i * 5;
        const t = lerp(f, [s, s + 14], [0, 1], easeOut);
        if (t <= 0) return null;
        const bob = Math.sin((f - s) / 14 + i) * 6;
        const x = W / 2 + pr.x * W - pr.w / 2 + (1 - t) * pr.from[0]! * W * 0.5;
        const y = cy + pr.y * H + (1 - t) * pr.from[1]! * H * 0.5 + bob;
        const xPrev = (1 - lerp(f - 1, [s, s + 14], [0, 1], easeOut)) * pr.from[0]! * W * 0.5;
        const dx = (1 - t) * pr.from[0]! * W * 0.5 - xPrev;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              opacity: Math.min(1, t * 2) * (1 - out),
            }}
          >
            {[1, 2, 3].map((k) => (
              <Img
                key={k}
                src={staticFile(pr.src)}
                style={{
                  position: 'absolute',
                  width: pr.w,
                  left: -dx * k * 0.5,
                  opacity: Math.abs(dx) > 5 ? 0.25 / k : 0,
                  borderRadius: 999,
                  transform: `rotate(${pr.rot}deg)`,
                }}
              />
            ))}
            <Img
              key="main"
              src={staticFile(pr.src)}
              style={{
                width: pr.w,
                display: 'block',
                borderRadius: pr.src.includes('pill') ? 999 : 24,
                transform: `rotate(${pr.rot}deg)`,
                boxShadow: '0 20px 50px rgba(20,20,20,0.18)',
                background: '#fff',
              }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function CardsBeat({ L, W, H }: { L: boolean; W: number; H: number }) {
  const f = useCurrentFrame();
  if (f < T.burst || f > T.wipe + 26) return null;
  const cw = L ? 720 : 760;
  const ch = cw * 0.46;
  const gap = L ? 70 : 80;
  // Cards fly out of the phone, sideways (landscape) or up/down (portrait), with trails.
  const b = (t: number) => lerp(t, [T.burst + 2, T.burst + 16], [0, 1], easeOut);
  const pan = lerp(f, [T.pan, T.pan + 30], [0, 1]);
  const focus = lerp(f, [T.pan + 6, T.pan + 30], [0, 1]);
  const spreadNow = b(f);
  const spreadPrev = b(f - 1);
  const pos = (i: 0 | 1, spread: number) => {
    const sign = i === 0 ? -1 : 1;
    if (L) {
      const homeX = W / 2 + sign * (cw / 2 + gap / 2) - cw / 2;
      return {
        x: W / 2 - cw / 2 + (homeX - (W / 2 - cw / 2)) * spread - pan * (cw / 2 + gap / 2),
        y: H / 2 - ch / 2,
      };
    }
    const homeY = H / 2 + sign * (ch / 2 + gap / 2) - ch / 2;
    return {
      x: W / 2 - cw / 2,
      y: H / 2 - ch / 2 + (homeY - (H / 2 - ch / 2)) * spread - pan * (ch / 2 + gap / 2),
    };
  };
  const push = lerp(f, [T.burst + 16, T.pan], [0, 0.05], easeOut);
  const scaleIn = (0.55 + 0.45 * spreadNow) * (1 + push);
  const sc1 = 1 + focus * 0.06;
  // Icon circle of the focused card (centre in stage px), for the wipe.
  const p1 = pos(1, spreadNow);
  const r0 = ch * 0.2 * sc1;
  const iconX = p1.x + cw / 2;
  const iconY = p1.y + ch / 2 + (ch * 0.16 + ch * 0.2 - ch / 2) * sc1;
  const grow = lerp(f, [T.wipe, T.wipe + 24], [0, 1], easeIn);
  const R = Math.hypot(W, H);
  const r = r0 + grow * (R - r0);

  const d1 = L
    ? `M ${0.12 * W} ${-0.1 * H} C ${-0.04 * W} ${0.2 * H}, ${0.06 * W} ${0.6 * H}, ${-0.06 * W} ${1.1 * H}`
    : `M ${0.25 * W} ${-0.05 * H} C ${-0.05 * W} ${0.15 * H}, ${0.08 * W} ${0.45 * H}, ${-0.1 * W} ${0.7 * H}`;
  const d2 = L
    ? `M ${1.05 * W} ${1.0 * H} C ${0.72 * W} ${1.0 * H}, ${0.7 * W} ${0.62 * H}, ${0.86 * W} ${0.3 * H} S ${1.02 * W} ${-0.05 * H}, ${1.05 * W} ${-0.1 * H}`
    : `M ${1.1 * W} ${1.0 * H} C ${0.7 * W} ${0.98 * H}, ${0.68 * W} ${0.72 * H}, ${0.86 * W} ${0.55 * H} S ${1.05 * W} ${0.35 * H}, ${1.1 * W} ${0.3 * H}`;
  const card = (i: 0 | 1) => {
    const now = pos(i, spreadNow);
    const prev = pos(i, spreadPrev);
    const dx = now.x - prev.x;
    const dy = now.y - prev.y;
    const faded = i === 0 ? focus : 0;
    const s = scaleIn * (i === 1 ? sc1 : 1 - focus * 0.04);
    const body = (opacity: number, ox: number, oy: number, key: number) => (
      <div
        key={key}
        style={{
          position: 'absolute',
          left: now.x - ox,
          top: now.y - oy,
          opacity,
          transform: `scale(${s})`,
        }}
      >
        <OptionCard
          label={i === 0 ? 'Okay' : 'Needs water'}
          icon={i === 0 ? CHECK : DROP}
          w={cw}
          faded={faded}
        />
      </div>
    );
    return (
      <>
        {Math.hypot(dx, dy) > 6 &&
          [3, 2, 1].map((k) => body(0.2 / k, dx * k * 0.6, dy * k * 0.6, k))}
        {body(Math.min(1, spreadNow * 2) * (1 - faded * 0.35), 0, 0, 0)}
      </>
    );
  };
  return (
    <AbsoluteFill style={{ background: f >= T.burst + 6 ? C.white : 'transparent' }}>
      <Ribbon d={d1} start={T.ribbon1} dur={26} width={L ? 120 : 130} />
      <Ribbon d={d2} start={T.ribbon2} dur={30} width={L ? 120 : 130} />
      {card(0)}
      {card(1)}
      {grow > 0 && (
        <div
          style={{
            position: 'absolute',
            left: iconX - r,
            top: iconY - r,
            width: r * 2,
            height: r * 2,
            borderRadius: '50%',
            background: C.green,
          }}
        />
      )}
    </AbsoluteFill>
  );
}

function FanBeat({ L, W, H }: { L: boolean; W: number; H: number }) {
  const f = useCurrentFrame();
  if (f < T.fanIn - 2 || f > T.fanOut + 18) return null;
  const pw = L ? 330 : 380;
  const out = lerp(f, [T.fanOut, T.fanOut + 16], [0, 1], easeIn);
  const wave = lerp(f, [T.wave, T.wave + 24], [0, 1], easeOut);
  const waveH = (L ? 0.3 : 0.26) * H * wave;
  const crest = (k: number) => Math.sin(k * Math.PI * 2 + f / 9) * 28 * wave;
  const path = `M 0 0 H ${W} V ${waveH + crest(1)} C ${W * 0.75} ${waveH + crest(0.75) + 40}, ${W * 0.5} ${waveH + crest(0.5) - 30}, ${W * 0.25} ${waveH + crest(0.25) + 30} S 0 ${waveH + crest(0)}, 0 ${waveH} Z`;
  return (
    <AbsoluteFill style={{ background: f >= T.wipe + 24 ? C.green : 'transparent' }}>
      <AbsoluteFill
        style={{
          perspective: 1800,
          opacity: 1 - out,
          transform: `translate(${out * W * 0.2}px, ${out * H * 0.25}px) scale(${1 + lerp(f, [T.fanIn + 20, T.fanOut], [0, 0.06], easeOut)})`,
          filter: out > 0 ? `blur(${out * 14}px)` : undefined,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: W / 2 - pw / 2,
            top: L ? H * 0.36 : H * 0.36,
            width: pw,
            height: (pw * SHOT.h) / SHOT.w,
          }}
        >
          {FAN.map((src, i) => {
            const mid = (FAN.length - 1) / 2;
            const d = i - mid;
            const s = T.fanIn + Math.abs(d) * 4;
            const t = lerp(f, [s, s + 18], [0, 1], easeOut);
            const tp = lerp(f - 1, [s, s + 18], [0, 1], easeOut);
            const y = (1 - t) * H * 1.1;
            const v = (tp - t) * H * 1.1;
            return (
              <div
                key={src}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 10 - Math.abs(d),
                  transform: `translate(${d * pw * (L ? 0.7 : 0.52)}px, ${y + Math.abs(d) * 34}px) scale(${1 - Math.abs(d) * 0.1}) rotate(${d * 5}deg)`,
                  filter:
                    Math.abs(v) > 15 ? `blur(${Math.min(12, Math.abs(v) / 10)}px)` : undefined,
                }}
              >
                <Phone src={src} width={pw} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      {wave > 0 && (
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: 1 - out }}>
          <path d={path} fill={C.white} />
        </svg>
      )}
      <div
        style={{
          position: 'absolute',
          top: H * (L ? 0.09 : 0.08),
          left: 0,
          right: 0,
          opacity: 1 - out,
        }}
      >
        <DropWords
          text="See every zone."
          start={T.fanWords}
          size={L ? 92 : 96}
          color={C.green}
          every={6}
        />
      </div>
    </AbsoluteFill>
  );
}

function SlideBeat({ L, W, H }: { L: boolean; W: number; H: number }) {
  const f = useCurrentFrame();
  if (f < T.slide || f >= T.scan) return null;
  const ph = H * (L ? 0.84 : 0.56);
  const pw = (ph * SHOT.w) / SHOT.h;
  const inP = lerp(f, [T.slide + 2, T.slide + 24], [0, 1], easeOut);
  const blob = lerp(f, [T.slide, T.slide + 18], [0, 1], easeOut);
  const words = ['Even', 'with', 'no', 'signal.'];
  const blobPath = L
    ? `M ${W} 0 L ${W * 0.86} 0 C ${W * 0.76} ${H * 0.18}, ${W * 0.7} ${H * 0.35}, ${W * 0.75} ${H * 0.52} S ${W * 0.66} ${H * 0.88}, ${W * 0.8} ${H} L ${W} ${H} Z`
    : `M ${W} ${H * 0.3} C ${W * 0.62} ${H * 0.32}, ${W * 0.5} ${H * 0.48}, ${W * 0.58} ${H * 0.64} S ${W * 0.38} ${H * 0.92}, ${W * 0.6} ${H} L ${W} ${H} Z`;
  return (
    <AbsoluteFill style={{ background: f >= T.fanOut + 16 ? C.green : 'transparent' }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <path d={blobPath} fill={C.white} transform={`translate(${(1 - blob) * W * 0.45} 0)`} />
      </svg>
      <div
        style={{
          position: 'absolute',
          ...(L ? { left: W * 0.1, top: 0, bottom: 0 } : { left: 0, right: 0, top: H * 0.12 }),
          display: 'flex',
          alignItems: 'center',
          justifyContent: L ? 'flex-start' : 'center',
          gap: 22,
        }}
      >
        {words.map((w, i) => {
          const t = rise(f, T.slideWords + i * 8, 14);
          return (
            <span
              key={i}
              style={{
                fontFamily: FONT,
                fontWeight: i >= 2 ? 700 : 400,
                fontSize: L ? 100 : 92,
                letterSpacing: -2,
                color: C.white,
                opacity: t,
                filter: `blur(${(1 - t) * 8}px)`,
                display: 'inline-block',
                transform: `scale(${0.9 + 0.1 * t})`,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          left: L ? W * 0.83 - pw / 2 : W * 0.66 - pw / 2,
          top: L ? H * 0.08 : H * 0.36,
          transform: `translate(${(1 - inP) * W * 0.5}px, ${Math.sin((f - T.slide) / 20) * 8}px) rotate(${(1 - inP) * 16 + 5 + Math.sin((f - T.slide) / 26)}deg)`,
        }}
      >
        <Phone src="checkin.png" width={pw} />
      </div>
    </AbsoluteFill>
  );
}

/** "done" slides up, its panel shrinks into the real app icon, which moves aside for the end card. */
function IconBeat({ L, W, H }: { L: boolean; W: number; H: number }) {
  const f = useCurrentFrame();
  if (f < T.done) return null;
  const tile = L ? 320 : 330;
  const textW = L ? 780 : 0;
  const gap = 56;
  const shrink = lerp(f, [T.shrink, T.shrink + 30], [0, 1]);
  const toEnd = lerp(f, [T.toEnd, T.toEnd + 26], [0, 1]);
  const w = W + (tile - W) * shrink;
  const h = H + (tile - H) * shrink;
  const endCx = L ? W / 2 - (tile + gap + textW) / 2 + tile / 2 : W / 2;
  const endCy = L ? H / 2 : H * 0.36;
  const cx = W / 2 + (endCx - W / 2) * toEnd;
  const cy = H / 2 + (endCy - H / 2) * toEnd;
  const fontSize = L ? 470 : 300;
  const up = lerp(f, [T.done, T.done + 6], [fontSize * 1.1, 0], easeOut);
  const upPrev = lerp(f - 1, [T.done, T.done + 6], [fontSize * 1.1, 0], easeOut);
  const textOut = lerp(f, [T.shrink + 6, T.shrink + 22], [0, 1], easeIn);
  const icon = lerp(f, [T.iconIn, T.iconIn + 14], [0, 1], easeOut);
  const e1 = rise(f, T.endText, 16);
  const e2 = rise(f, T.endText + 8, 16);
  const e3 = rise(f, T.endText + 20, 14);
  const word = (
    <span
      style={{
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: fontSize * (1 - shrink * 0.75),
        letterSpacing: -fontSize * 0.045,
        color: C.white,
        opacity: 1 - textOut,
        filter: textOut > 0 ? `blur(${textOut * 16}px)` : undefined,
        transform: `translateY(${up}px)`,
        whiteSpace: 'nowrap',
      }}
    >
      done
    </span>
  );
  return (
    <AbsoluteFill style={{ background: shrink > 0 ? C.white : C.green }}>
      {f >= T.toEnd && (
        <>
          <Ribbon
            d={
              L
                ? `M ${-0.05 * W} ${0.55 * H} C ${0.1 * W} ${0.6 * H}, ${0.16 * W} ${0.9 * H}, ${0.12 * W} ${1.12 * H}`
                : `M ${-0.1 * W} ${0.78 * H} C ${0.2 * W} ${0.82 * H}, ${0.3 * W} ${0.95 * H}, ${0.25 * W} ${1.1 * H}`
            }
            start={T.toEnd + 6}
            dur={30}
            width={L ? 120 : 130}
            color="rgba(22,146,63,0.12)"
          />
          <Ribbon
            d={
              L
                ? `M ${0.82 * W} ${-0.12 * H} C ${0.8 * W} ${0.15 * H}, ${0.95 * W} ${0.26 * H}, ${1.12 * W} ${0.3 * H}`
                : `M ${0.7 * W} ${-0.05 * H} C ${0.68 * W} ${0.12 * H}, ${0.9 * W} ${0.2 * H}, ${1.12 * W} ${0.22 * H}`
            }
            start={T.toEnd + 12}
            dur={30}
            width={L ? 120 : 130}
            color="rgba(22,146,63,0.12)"
          />
        </>
      )}
      <div
        style={{
          position: 'absolute',
          left: cx - w / 2,
          top: cy - h / 2,
          width: w,
          height: h,
          borderRadius: shrink * tile * 0.5,
          background: C.green,
          opacity: 1 - icon,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {Math.abs(up - upPrev) > 5 ? (
          <Trail dy={up - upPrev}>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
              {word}
            </AbsoluteFill>
          </Trail>
        ) : (
          word
        )}
      </div>
      <div style={{ position: 'absolute', left: cx - tile / 2, top: cy - tile / 2 }}>
        <Logo size={tile} start={T.iconIn - 4} />
      </div>
      <div
        style={{
          position: 'absolute',
          fontFamily: FONT,
          ...(L
            ? {
                left: endCx + tile / 2 + gap,
                top: H / 2 - 175,
                width: textW,
                textAlign: 'left' as const,
              }
            : { left: 0, right: 0, top: endCy + tile / 2 + 60, textAlign: 'center' as const }),
        }}
      >
        <div
          style={{
            fontSize: L ? 80 : 78,
            fontWeight: 500,
            color: C.text,
            letterSpacing: -1.5,
            lineHeight: 1.1,
            opacity: e1,
            transform: `translateY(${(1 - e1) * 24}px)`,
          }}
        >
          Watch every plant.
        </div>
        <div
          style={{
            fontSize: L ? 156 : 150,
            fontWeight: 700,
            color: C.green,
            letterSpacing: -4,
            lineHeight: 1,
            opacity: e2,
            transform: `translateY(${(1 - e2) * 24}px)`,
          }}
        >
          Lose less.
        </div>
        <div
          style={{
            display: 'inline-block',
            marginTop: 24,
            padding: '14px 34px',
            borderRadius: 999,
            background: C.green,
            color: C.white,
            fontSize: L ? 36 : 38,
            fontWeight: 500,
            opacity: e3,
            transform: `scale(${0.85 + 0.15 * e3})`,
            transformOrigin: L ? 'left center' : 'center',
          }}
        >
          Cebuano · English · Tagalog
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function Explainer2({ layout }: { layout: Layout }) {
  const { width: W, height: H } = useVideoConfig();
  const L = layout === 'landscape';
  const big = L ? 620 : 330;
  return (
    <AbsoluteFill style={{ backgroundColor: C.white, overflow: 'hidden', fontFamily: FONT }}>
      <Punch text="plants" from={T.plants} to={T.drying} green size={big} />
      <Punch text="drying" from={T.drying} to={T.out} green={false} size={big} />
      <Punch text="out." from={T.out} to={T.zones} green size={big} />
      <Punch
        text={'but too many\nzones'}
        from={T.zones}
        to={T.toCheck}
        green={false}
        size={L ? 230 : 150}
      />
      <Punch
        text="to check?"
        from={T.toCheck}
        to={T.toCheckOut + 14}
        green
        size={L ? 300 : 190}
        shrinkTo={0.8}
        exitAt={T.toCheckOut}
      />
      <PhoneBeat L={L} W={W} H={H} />
      <CardsBeat L={L} W={W} H={H} />
      <FanBeat L={L} W={W} H={H} />
      <SlideBeat L={L} W={W} H={H} />
      <Punch text="scan" from={T.scan} to={T.check} green size={big} />
      <Punch text="check" from={T.check} to={T.done} green={false} size={big} />
      <IconBeat L={L} W={W} H={H} />
    </AbsoluteFill>
  );
}
