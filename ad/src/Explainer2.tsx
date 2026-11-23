/**
 * Uma explainer #2, following inspo2.mp4's motion language (word punches, a 3D
 * phone, option cards with a ribbon stroke, an icon that grows into a full-screen
 * wipe, a fan of screens, a slide-in phone, and a panel that shrinks into the app
 * icon), in Uma's own design: Outfit, green #16923F, orange only for emphasis,
 * near-black text, white and #F4F4F1. All screens are real app captures.
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

import { Clip, type Crop } from './components/Screen';
import { easeIn, easeInOut, easeOut, rise } from './ease';
import { loadFonts } from './fonts';
import { C, FONT, SHOT, type Layout } from './theme';

loadFonts();

export const TOTAL_FRAMES_2 = 880;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const lerp = (f: number, a: number[], b: number[], easing = easeInOut) =>
  interpolate(f, a, b, { easing, ...clamp });

// Real-screenshot crops (screenshot px).
const OKAY: Crop = { x: 60, y: 800, w: 1140, h: 260 };
const WATER: Crop = { x: 60, y: 1082, w: 1140, h: 260 };
const ICON_IN_CARD = { x: 130, y: 130 }; // centre of the row's icon circle, inside the crop
const PROPS: { src: string; crop: Crop }[] = [
  { src: 'map.png', crop: { x: 80, y: 754, w: 416, h: 104 } }, // POT-01 Okay
  { src: 'zone.png', crop: { x: 790, y: 1438, w: 390, h: 135 } }, // 54% Just right · Sample data
  { src: 'map.png', crop: { x: 684, y: 1420, w: 386, h: 104 } }, // Z-04 Water
  { src: 'profile-synced.png', crop: { x: 75, y: 2325, w: 1110, h: 195 } }, // All records synced
];
const FAN = ['home.png', 'map.png', 'zone.png', 'checkin.png', 'profile-synced.png'];

// ─── Pieces ───

/** A phone with a clean bezel around a real screenshot. */
function Phone({ src, width }: { src: string; width: number }) {
  const h = (width * SHOT.h) / SHOT.w;
  const b = width * 0.035;
  return (
    <div
      style={{
        padding: b,
        borderRadius: width * 0.13 + b,
        background: '#1B1B1A',
        boxShadow: '0 40px 90px rgba(20,20,20,0.22), 0 10px 24px rgba(20,20,20,0.12)',
      }}
    >
      <div style={{ width, height: h, borderRadius: width * 0.13, overflow: 'hidden' }}>
        <Img src={staticFile(`screens/${src}`)} style={{ width, height: h }} />
      </div>
    </div>
  );
}

/** Copies along the motion direction: cheap, clean motion blur for fast moves. */
function Trail({
  dx = 0,
  dy = 0,
  speed,
  children,
}: {
  dx?: number;
  dy?: number;
  speed: number;
  children: ReactNode;
}) {
  const n = speed > 6 ? 6 : 1;
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <AbsoluteFill
          key={i}
          style={{
            transform: `translate(${dx * i * 0.35}px, ${dy * i * 0.35}px)`,
            opacity: n === 1 ? 1 : i === 0 ? 0.55 : 0.45 / (i + 1),
          }}
        >
          {children}
        </AbsoluteFill>
      ))}
    </>
  );
}

/**
 * A word punch: the word slides up into place fast with a vertical motion
 * trail, then holds. Background is green (white text) or white (near-black text).
 */
function Punch({
  text,
  from,
  to,
  green,
  size,
  scaleTo = 1,
  lines,
}: {
  text: string;
  from: number;
  to: number;
  green: boolean;
  size: number;
  scaleTo?: number;
  lines?: boolean;
}) {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  const y = (t: number) => lerp(t, [from, from + 7], [size * 0.9, 0], easeOut);
  const v = Math.abs(y(f) - y(f - 1));
  const s = lerp(f, [from + 8, to], [1, scaleTo], easeInOut);
  return (
    <AbsoluteFill style={{ background: green ? C.green : C.white }}>
      <Trail dy={y(f) - y(f - 1)} speed={v}>
        <AbsoluteFill
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            transform: `translateY(${y(f)}px) scale(${s})`,
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: size,
              lineHeight: lines ? 1.02 : 1,
              letterSpacing: -size * 0.045,
              color: green ? C.white : C.text,
              textAlign: 'center',
              whiteSpace: 'pre-line',
            }}
          >
            {text}
          </div>
        </AbsoluteFill>
      </Trail>
    </AbsoluteFill>
  );
}

/** Words that drop in one by one (the reference's "pick your favorite"). */
function DropWords({
  text,
  start,
  size,
  color,
  every = 5,
  weight = 600,
}: {
  text: string;
  start: number;
  size: number;
  color: string;
  every?: number;
  weight?: number;
}) {
  const f = useCurrentFrame();
  return (
    <div style={{ display: 'flex', gap: size * 0.26, justifyContent: 'center', flexWrap: 'wrap' }}>
      {text.split(' ').map((w, i) => {
        const t = rise(f, start + i * every, 12);
        return (
          <span
            key={i}
            style={{
              fontFamily: FONT,
              fontWeight: weight,
              fontSize: size,
              letterSpacing: -size * 0.02,
              color,
              opacity: t,
              filter: `blur(${(1 - t) * 6}px)`,
              display: 'inline-block',
              transform: `translateY(${(1 - t) * -size * 0.6}px) rotate(${(1 - t) * (i % 2 ? 8 : -8)}deg)`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
}

/** A thick green stroke drawing itself along a path (the reference's ribbon). */
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

// ─── Beats ───

function PhoneBeat({ L, W, H }: { L: boolean; W: number; H: number }) {
  const f = useCurrentFrame();
  if (f < 112 || f > 262) return null;
  const pw = L ? 360 : 520;
  const rise3d = lerp(f, [112, 156], [0, 1], easeOut);
  const out = lerp(f, [236, 254], [0, 1], easeIn);
  return (
    <AbsoluteFill>
      {/* Headline, words dropping in, Uma green. */}
      <div style={{ position: 'absolute', top: L ? 70 : 230, left: 0, right: 0, opacity: 1 - out }}>
        <DropWords
          text="Uma keeps track."
          start={150}
          size={L ? 84 : 92}
          color={C.green}
          weight={600}
        />
      </div>
      {/* Floating real UI pieces around the phone, like the reference's product props. */}
      {PROPS.map((p, i) => {
        const t = rise(f, 164 + i * 6, 16);
        const bob = Math.sin((f - 160) / 18 + i) * 6;
        const pos = L
          ? [
              { x: W / 2 - pw / 2 - 360, y: H * 0.42 },
              { x: W / 2 + pw / 2 + 40, y: H * 0.34 },
              { x: W / 2 - pw / 2 - 300, y: H * 0.7 },
              { x: W / 2 + pw / 2 + 10, y: H * 0.66 },
            ][i]!
          : [
              { x: 40, y: H * 0.44 },
              { x: W - 360, y: H * 0.36 },
              { x: 60, y: H * 0.74 },
              { x: W - 470, y: H * 0.8 },
            ][i]!;
        const w = i === 3 ? (L ? 420 : 430) : L ? 300 : 320;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y + bob,
              opacity: t * (1 - out),
              filter: `blur(${(1 - t) * 8 + out * 10}px)`,
              transform: `scale(${0.7 + 0.3 * t}) rotate(${(i % 2 ? 6 : -6) * (1 - t * 0.6)}deg)`,
              boxShadow: '0 20px 50px rgba(20,20,20,0.16)',
              borderRadius: 999,
              zIndex: 2,
            }}
          >
            <Clip src={p.src} crop={p.crop} width={w} radius={(w * p.crop.h) / p.crop.w / 2} />
          </div>
        );
      })}
      {/* The phone rises and un-tilts in 3D, then blurs away as the cards burst out. */}
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: L ? 'flex-start' : 'center',
          perspective: 1600,
        }}
      >
        <div
          style={{
            marginTop: L ? 190 : 120,
            opacity: 1 - out,
            filter: `blur(${out * 14}px)`,
            transform: `translateY(${(1 - rise3d) * H * 0.9}px) rotateX(${(1 - rise3d) * 38}deg) rotateZ(${(1 - rise3d) * -8}deg) scale(${1 - out * 0.3})`,
          }}
        >
          <Phone src="home.png" width={pw} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function CardsBeat({ L, W, H }: { L: boolean; W: number; H: number }) {
  const f = useCurrentFrame();
  if (f < 240 || f > 420) return null;
  const cw = L ? 780 : 840;
  const ch = (cw * OKAY.h) / OKAY.w;
  const gap = L ? 60 : 70;
  // Cards burst out of the phone, then the camera pans to "Needs water".
  const burst = rise(f, 242, 18);
  const pan = lerp(f, [300, 344], [0, 1]);
  const dim = lerp(f, [318, 346], [0, 1]);
  // Landscape: side by side, pan left. Portrait: stacked, pan up.
  const okay = L
    ? { x: W / 2 - cw - gap / 2 - pan * (cw / 2 + gap / 2) * 1.2, y: H / 2 - ch / 2 }
    : { x: W / 2 - cw / 2, y: H / 2 - ch - gap / 2 - pan * (ch / 2 + gap / 2) * 1.2 };
  const water = L
    ? { x: W / 2 + gap / 2 - pan * (cw / 2 + gap / 2) * 1.2, y: H / 2 - ch / 2 }
    : { x: W / 2 - cw / 2, y: H / 2 + gap / 2 - pan * (ch / 2 + gap / 2) * 1.2 };
  const focus = 1 + dim * 0.08;
  const k = (cw / OKAY.w) * focus;
  // The icon circle of "Needs water" grows into a full-screen green wipe.
  const iconX = water.x + ICON_IN_CARD.x * k - (cw * (focus - 1)) / 2;
  const iconY = water.y + ICON_IN_CARD.y * k - (ch * (focus - 1)) / 2;
  const grow = lerp(f, [370, 404], [0, 1], easeIn);
  const R = Math.hypot(W, H) * 1.05;
  const r = 100 * k + grow * (R - 100 * k);
  const card = (
    src: string,
    crop: Crop,
    pos: { x: number; y: number },
    faded: number,
    sc: number,
    delay: number,
  ) => {
    const b = rise(f, 242 + delay, 18);
    return (
      <div
        style={{
          position: 'absolute',
          left: pos.x,
          top: pos.y,
          opacity: b * (1 - faded * 0.65),
          filter: `blur(${(1 - b) * 12 + faded * 2}px)`,
          transform: `scale(${(0.6 + 0.4 * b) * sc})`,
          boxShadow: `0 24px 60px rgba(20,20,20,${0.1 + 0.08 * (sc - 1) * 10})`,
          borderRadius: ch / 2,
        }}
      >
        <Clip src={src} crop={crop} width={cw} radius={ch / 2} />
      </div>
    );
  };
  const d1 = L
    ? `M ${-0.05 * W} ${1.05 * H} C ${0.02 * W} ${0.6 * H}, ${-0.05 * W} ${0.25 * H}, ${0.12 * W} ${-0.05 * H}`
    : `M ${-0.1 * W} ${0.95 * H} C ${0.05 * W} ${0.65 * H}, ${-0.1 * W} ${0.3 * H}, ${0.2 * W} ${-0.05 * H}`;
  const d2 = L
    ? `M ${1.05 * W} ${0.95 * H} C ${0.7 * W} ${0.98 * H}, ${0.72 * W} ${0.6 * H}, ${0.88 * W} ${0.25 * H} S ${1.05 * W} ${-0.05 * H}, ${1.05 * W} ${-0.05 * H}`
    : `M ${1.1 * W} ${0.9 * H} C ${0.6 * W} ${0.95 * H}, ${0.65 * W} ${0.62 * H}, ${0.9 * W} ${0.45 * H} S ${1.1 * W} ${0.3 * H}, ${1.1 * W} ${0.3 * H}`;
  return (
    <AbsoluteFill style={{ background: C.white, opacity: burst > 0 ? 1 : 0 }}>
      <Ribbon d={d1} start={262} dur={40} width={L ? 120 : 130} />
      <Ribbon d={d2} start={320} dur={40} width={L ? 120 : 130} />
      {card('checkin.png', OKAY, okay, dim, 1, 0)}
      {card('checkin.png', WATER, water, 0, focus, 5)}
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
  if (f < 402 || f > 566) return null;
  const pw = L ? 300 : 360;
  const out = lerp(f, [546, 564], [0, 1], easeIn);
  const wave = lerp(f, [470, 500], [0, 1], easeOut);
  const waveH = (L ? 0.34 : 0.3) * H * wave;
  const crest = (t: number) => Math.sin(t * Math.PI * 2 + f / 10) * 26 * wave;
  const path = `M 0 0 H ${W} V ${waveH + crest(1)} C ${W * 0.75} ${waveH + crest(0.75) + 40}, ${W * 0.5} ${waveH + crest(0.5) - 30}, ${W * 0.25} ${waveH + crest(0.25) + 30} S 0 ${waveH + crest(0)}, 0 ${waveH} Z`;
  return (
    <AbsoluteFill style={{ background: C.green }}>
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          perspective: 1800,
          paddingTop: L ? 180 : 240,
          opacity: 1 - out,
          filter: `blur(${out * 12}px)`,
          transform: `translate(${out * W * 0.15}px, ${out * H * 0.1}px)`,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: pw,
            height: (pw * SHOT.h) / SHOT.w,
            transformStyle: 'preserve-3d',
          }}
        >
          {FAN.map((src, i) => {
            const mid = (FAN.length - 1) / 2;
            const t = rise(f, 404 + i * 4, 20);
            const y = (1 - t) * H;
            const v = (1 - rise(f - 1, 404 + i * 4, 20)) * H - y;
            return (
              <div
                key={src}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: FAN.length - Math.abs(i - mid),
                  transform: `translate3d(${(i - mid) * pw * (L ? 0.55 : 0.42)}px, ${y + Math.abs(i - mid) * 26}px, ${-Math.abs(i - mid) * 120}px) rotateY(${(i - mid) * -8}deg) rotateZ(${(i - mid) * 3}deg)`,
                  filter: v > 20 ? `blur(${Math.min(10, v / 12)}px)` : undefined,
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
          top: (L ? 0.12 : 0.11) * H,
          left: 0,
          right: 0,
          opacity: 1 - out,
        }}
      >
        <DropWords
          text="See every zone."
          start={490}
          size={L ? 80 : 88}
          color={C.green}
          every={6}
        />
      </div>
    </AbsoluteFill>
  );
}

function SlideBeat({ L, W, H }: { L: boolean; W: number; H: number }) {
  const f = useCurrentFrame();
  if (f < 556 || f > 668) return null;
  const pw = L ? 340 : 420;
  const inP = rise(f, 558, 22);
  const blob = lerp(f, [556, 574], [0, 1], easeOut);
  const out = lerp(f, [652, 666], [0, 1], easeIn);
  const words = 'Even with no signal.'.split(' ');
  const blobPath = L
    ? `M ${W} 0 C ${W * 0.84} ${H * 0.1}, ${W * 0.76} ${H * 0.3}, ${W * 0.8} ${H * 0.5} S ${W * 0.7} ${H * 0.86}, ${W * 0.86} ${H} L ${W} ${H} Z`
    : `M ${W} ${H * 0.28} C ${W * 0.62} ${H * 0.3}, ${W * 0.52} ${H * 0.45}, ${W * 0.6} ${H * 0.62} S ${W * 0.4} ${H * 0.9}, ${W * 0.62} ${H} L ${W} ${H} Z`;
  return (
    <AbsoluteFill style={{ background: C.green }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <path
          d={blobPath}
          fill={C.white}
          transform={`translate(${(1 - blob) * W * 0.4} 0)`}
          opacity={blob}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          ...(L ? { left: 150, top: 0, bottom: 0 } : { left: 0, right: 0, top: H * 0.13 }),
          display: 'flex',
          alignItems: 'center',
          justifyContent: L ? 'flex-start' : 'center',
          gap: (L ? 76 : 80) * 0.26,
          opacity: 1 - out,
        }}
      >
        {words.map((w, i) => {
          const t = rise(f, 578 + i * 9, 14);
          return (
            <span
              key={i}
              style={{
                fontFamily: FONT,
                fontWeight: i >= 2 ? 700 : 400,
                fontSize: L ? 76 : 80,
                letterSpacing: -1.5,
                color: C.white,
                opacity: t,
                filter: `blur(${(1 - t) * 8}px)`,
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
          ...(L ? { right: W * 0.08, top: H * 0.1 } : { right: W * 0.08, top: H * 0.34 }),
          opacity: inP * (1 - out),
          transform: `translateX(${(1 - inP) * W * 0.5}px) rotate(${(1 - inP) * 14 + 4}deg)`,
        }}
      >
        <Phone src="checkin.png" width={pw} />
      </div>
    </AbsoluteFill>
  );
}

/** "done" panel shrinks into the real Uma app icon, which then slides left for the end card. */
function IconBeat({ L, W, H }: { L: boolean; W: number; H: number }) {
  const f = useCurrentFrame();
  if (f < 714) return null;
  const s = L ? 230 : 260;
  const shrink = lerp(f, [724, 752], [0, 1]);
  const w = W + (s - W) * shrink;
  const h = H + (s - H) * shrink;
  const textOut = lerp(f, [724, 740], [0, 1], easeIn);
  const textUp = lerp(f, [714, 721], [(L ? 260 : 220) * 0.9, 0], easeOut);
  const icon = rise(f, 744, 12);
  const slide = lerp(f, [764, 792], [0, 1]);
  const cx = L ? W / 2 - slide * 300 : W / 2;
  const cy = L ? H / 2 : H / 2 - slide * 260;
  const end = rise(f, 778, 16);
  return (
    <AbsoluteFill style={{ background: shrink > 0 ? C.white : C.green }}>
      <EndRibbons L={L} W={W} H={H} start={776} />
      <div
        style={{
          position: 'absolute',
          left: cx - w / 2,
          top: cy - h / 2,
          width: w,
          height: h,
          borderRadius: shrink * s * 0.22,
          background: C.green,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: shrink > 0.9 ? '0 24px 60px rgba(22,146,63,0.25)' : 'none',
        }}
      >
        <span
          style={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: (L ? 260 : 220) * (1 - shrink * 0.6),
            letterSpacing: -10,
            color: C.white,
            opacity: 1 - textOut,
            filter: `blur(${textOut * 14}px)`,
            transform: `translateY(${textUp}px)`,
          }}
        >
          done
        </span>
        <Img
          src={staticFile('brand/uma-app-icon.png')}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: icon }}
        />
      </div>
      {/* End card text */}
      <div
        style={{
          position: 'absolute',
          ...(L
            ? { left: cx + s / 2 + 50, top: cy - 150, textAlign: 'left' as const }
            : { left: 0, right: 0, top: cy + s / 2 + 50, textAlign: 'center' as const }),
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            fontSize: L ? 64 : 66,
            fontWeight: 500,
            color: C.text,
            letterSpacing: -1.5,
            opacity: end,
            transform: `translateY(${(1 - end) * 24}px)`,
          }}
        >
          Watch every plant.
        </div>
        <div
          style={{
            fontSize: L ? 104 : 108,
            fontWeight: 700,
            color: C.green,
            letterSpacing: -3,
            lineHeight: 1,
            opacity: rise(f, 786, 16),
            transform: `translateY(${(1 - rise(f, 786, 16)) * 24}px)`,
          }}
        >
          Lose less.
        </div>
        <div
          style={{
            display: 'inline-block',
            marginTop: 22,
            padding: '12px 30px',
            borderRadius: 999,
            background: C.green,
            color: C.white,
            fontSize: L ? 30 : 32,
            fontWeight: 500,
            opacity: rise(f, 798, 14),
            transform: `scale(${0.8 + 0.2 * rise(f, 798, 14)})`,
          }}
        >
          Cebuano · English · Tagalog
        </div>
      </div>
    </AbsoluteFill>
  );
}

/** Faint green ribbon strokes behind the end card (the reference's background curves). */
function EndRibbons({ L, W, H, start }: { L: boolean; W: number; H: number; start: number }) {
  const color = 'rgba(22,146,63,0.12)';
  return (
    <>
      <Ribbon
        d={
          L
            ? `M ${-0.05 * W} ${0.55 * H} C ${0.1 * W} ${0.6 * H}, ${0.15 * W} ${0.9 * H}, ${0.12 * W} ${1.1 * H}`
            : `M ${-0.1 * W} ${0.75 * H} C ${0.2 * W} ${0.8 * H}, ${0.3 * W} ${0.95 * H}, ${0.25 * W} ${1.1 * H}`
        }
        start={start}
        dur={30}
        width={L ? 110 : 120}
        color={color}
      />
      <Ribbon
        d={
          L
            ? `M ${0.82 * W} ${-0.1 * H} C ${0.8 * W} ${0.15 * H}, ${0.95 * W} ${0.25 * H}, ${1.1 * W} ${0.3 * H}`
            : `M ${0.7 * W} ${-0.05 * H} C ${0.68 * W} ${0.12 * H}, ${0.9 * W} ${0.2 * H}, ${1.1 * W} ${0.22 * H}`
        }
        start={start + 6}
        dur={30}
        width={L ? 110 : 120}
        color={color}
      />
    </>
  );
}

export function Explainer2({ layout }: { layout: Layout }) {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const L = layout === 'landscape';
  const big = L ? 300 : 230;
  return (
    <AbsoluteFill style={{ backgroundColor: C.white, overflow: 'hidden', fontFamily: FONT }}>
      {/* 1. Word punches */}
      <Punch text="plants" from={0} to={24} green size={big} />
      <Punch text="drying" from={24} to={46} green={false} size={big} />
      <Punch
        text={'plants drying out,\nbut too many zones'}
        from={46}
        to={82}
        green
        size={L ? 96 : 84}
        lines
      />
      {f >= 82 && f < 126 && (
        <Punch
          text="to check?"
          from={82}
          to={126}
          green={false}
          size={L ? 190 : 150}
          scaleTo={0.55}
        />
      )}
      {/* 2. Phone in 3D, 3. cards + ribbon + icon wipe, 4. fan of screens, 5. slide-in phone */}
      <PhoneBeat L={L} W={W} H={H} />
      <CardsBeat L={L} W={W} H={H} />
      <FanBeat L={L} W={W} H={H} />
      <SlideBeat L={L} W={W} H={H} />
      {/* 6. Word punches, then "done" becomes the app icon, 7. end card */}
      <Punch text="scan" from={668} to={690} green size={big} />
      <Punch text="check" from={690} to={714} green={false} size={big} />
      <IconBeat L={L} W={W} H={H} />
    </AbsoluteFill>
  );
}
