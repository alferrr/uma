import type { ReactNode } from 'react';
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';

import { Logo } from './components/Logo';
import { Ring, ScanSweep } from './components/Ring';
import { Clip, FULL, Screen, type Crop, type Pose } from './components/Screen';
import { TypeIn, WordPop } from './components/WordPop';
import { easeIn, easeInOut, easeOut, fall, keys, rise } from './ease';
import { loadFonts } from './fonts';
import { C, FONT, SHOT, type Layout } from './theme';

loadFonts();

/** The intro runs this many frames longer than the rest was built for; everything after it shifts. */
const INTRO_EXTRA = 64;
export const TOTAL_FRAMES = 1330 + INTRO_EXTRA;

// ─── Spots in the real screenshots (screenshot px) ───
const SCAN_WIN: Crop = { x: 255, y: 1035, w: 752, h: 752 };
const ZONE_CARD: Crop = { x: 44, y: 1350, w: 1176, h: 380 };
const MOIST_TXT: Crop = { x: 800, y: 1445, w: 365, h: 115 };
const TILES: Crop = { x: 40, y: 1690, w: 1180, h: 470 };
const JUST_RIGHT: Crop = { x: 452, y: 1816, w: 354, h: 324 };
const MAP_SUMMARY: Crop = { x: 40, y: 2080, w: 1180, h: 515 };
const PROFILE_SYNC: Crop = { x: 75, y: 2325, w: 1110, h: 195 };
const QR_LABEL: Crop = { x: 75, y: 915, w: 1110, h: 995 };
const TAGS: Crop[] = [
  { x: 80, y: 754, w: 416, h: 104 }, // POT-01 Okay
  { x: 684, y: 754, w: 366, h: 104 }, // Z-02 Okay
  { x: 80, y: 1420, w: 502, h: 104 }, // Z-03 Not checked
  { x: 684, y: 1420, w: 386, h: 104 }, // Z-04 Water
];
const FOCUS = 3;

/** Stage layout for each aspect ratio. */
function geo(layout: Layout, W: number, H: number) {
  const L = layout === 'landscape';
  const phoneW = L ? 400 : 560;
  return {
    L,
    W,
    H,
    phone: { cx: W / 2, cy: L ? 560 : 1080, w: phoneW, h: (phoneW * SHOT.h) / SHOT.w },
    card: { cx: W / 2, cy: L ? 600 : 1010, w: L ? 1100 : 940 },
    big: L ? 112 : 92,
    text: L ? 76 : 70,
    caption: { top: L ? 110 : 300 },
    labelGap: L ? 70 : 0,
    list: { cx: L ? 1260 : W / 2, top: L ? 250 : 820, k: L ? 1.25 : 1.3, gap: L ? 34 : 40 },
  };
}
type G = ReturnType<typeof geo>;

const phonePose = (g: G, f: number, src: string, extra: Partial<Pose> = {}): Pose => ({
  f,
  src,
  cx: g.phone.cx,
  cy: g.phone.cy,
  w: g.phone.w,
  h: g.phone.h,
  crop: FULL,
  r: g.phone.w * 0.13,
  bezel: 1,
  ...extra,
});

const cardPose = (g: G, f: number, src: string, crop: Crop, extra: Partial<Pose> = {}): Pose => ({
  f,
  src,
  cx: g.card.cx,
  cy: g.card.cy,
  w: g.card.w,
  h: (g.card.w * crop.h) / crop.w,
  crop,
  r: 36,
  bezel: 0,
  ...extra,
});

/** Where the focus-pull list puts each pill. */
function pill(g: G, i: number, f: number) {
  const w = TAGS[i]!.w * g.list.k;
  const h = TAGS[i]!.h * g.list.k;
  const drift = -Math.min(Math.max(f - 722, 0), 84) * 0.4; // slow upward drift, like the reference list
  const cy = g.list.top + i * (h + g.list.gap) + h / 2 + drift;
  return { w, h, cx: g.list.cx, cy };
}

function poses(g: G): Pose[] {
  const offBelow = { cy: g.H + g.phone.h / 2 + 80 };
  const z = pill(g, FOCUS, 806);
  const small = {
    cx: g.W * 0.47,
    cy: g.H * (g.L ? 0.55 : 0.6),
    w: g.L ? 420 : 460,
    h: ((g.L ? 420 : 460) * ZONE_CARD.h) / ZONE_CARD.w,
    rot: -14,
  };
  return [
    phonePose(g, 210, 'scan.png', { ...offBelow, op: 1 }),
    phonePose(g, 246, 'scan.png'),
    phonePose(g, 318, 'scan.png'),
    phonePose(g, 332, 'zone.png'),
    phonePose(g, 384, 'zone.png'),
    cardPose(g, 418, 'zone.png', ZONE_CARD),
    cardPose(g, 492, 'zone.png', ZONE_CARD),
    // Swoosh: the card rides the stroke, morphs into the next screen while small, and comes back.
    { ...cardPose(g, 506, 'zone.png', ZONE_CARD), ...small },
    { ...cardPose(g, 518, 'checkin.png', TILES), ...small, h: (small.w * TILES.h) / TILES.w },
    cardPose(g, 536, 'checkin.png', TILES),
    cardPose(g, 604, 'checkin.png', TILES),
    phonePose(g, 636, 'checkin.png'),
    phonePose(g, 640, 'checkin.png'),
    phonePose(g, 654, 'saved.png'),
    phonePose(g, 708, 'saved.png'),
    phonePose(g, 726, 'saved.png', {
      w: g.phone.w * 0.7,
      h: g.phone.h * 0.7,
      cy: g.phone.cy + 80,
      op: 0,
    }),
    // Hand-off from the focus-pull list: the tapped pill *is* the map, cropped.
    {
      f: 805,
      src: 'map.png',
      cx: z.cx,
      cy: z.cy,
      w: z.w * 1.06,
      h: z.h * 1.06,
      crop: TAGS[FOCUS]!,
      r: (z.h * 1.06) / 2,
      bezel: 0,
      op: 0,
    },
    {
      f: 806,
      src: 'map.png',
      cx: z.cx,
      cy: z.cy,
      w: z.w * 1.06,
      h: z.h * 1.06,
      crop: TAGS[FOCUS]!,
      r: (z.h * 1.06) / 2,
      bezel: 0,
      op: 1,
    },
    phonePose(g, 846, 'map.png'),
    phonePose(g, 914, 'map.png'),
    phonePose(g, 928, 'profile-pending.png'),
    phonePose(g, 968, 'profile-pending.png'),
    phonePose(g, 982, 'profile-synced.png'),
    phonePose(g, 1032, 'profile-synced.png'),
    phonePose(g, 1050, 'profile-synced.png', { ...offBelow, op: 0 }),
  ];
}

// ─── Building blocks ───

/** Soft mint wash of the reference's type scenes, fading to white. */
function Mint({ op }: { op: number }) {
  if (op <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        opacity: op,
        background:
          'radial-gradient(ellipse 90% 80% at 15% 10%, #CDEBD7 0%, #E6F5EB 45%, #FFFFFF 100%)',
      }}
    />
  );
}

/** Green glow behind the phone. */
function Glow({ g, op }: { g: G; op: number }) {
  if (op <= 0) return null;
  const d = g.phone.h * 1.6;
  return (
    <div
      style={{
        position: 'absolute',
        left: g.phone.cx - d / 2,
        top: g.phone.cy - d / 2,
        width: d,
        height: d,
        borderRadius: '50%',
        opacity: op,
        background:
          'radial-gradient(circle, rgba(22,146,63,0.42) 0%, rgba(22,146,63,0.16) 38%, rgba(22,146,63,0) 68%)',
      }}
    />
  );
}

/** Two short labels either side of the phone (landscape) or above it (portrait). */
function Labels({
  g,
  left,
  right,
  start,
  exit,
}: {
  g: G;
  left: string;
  right: string;
  start: number;
  exit: number;
}) {
  if (g.L) {
    const half = g.phone.w / 2 + g.labelGap;
    return (
      <>
        <div
          style={{
            position: 'absolute',
            right: g.W - (g.phone.cx - half),
            top: g.phone.cy - 120,
            width: 640,
          }}
        >
          <WordPop text={left} start={start} exit={exit} size={g.text} align="right" />
        </div>
        <div
          style={{
            position: 'absolute',
            left: g.phone.cx + half,
            top: g.phone.cy - 120,
            width: 640,
          }}
        >
          <WordPop
            text={`**${right}**`}
            start={start + 8}
            exit={exit + 4}
            size={g.text}
            align="left"
          />
        </div>
      </>
    );
  }
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 170 }}>
      <WordPop text={`${left}|**${right}**`} start={start} exit={exit} size={g.text} />
    </div>
  );
}

/** A caption above a zoomed card. */
function Caption({ g, text, start, exit }: { g: G; text: string; start: number; exit: number }) {
  return (
    <div style={{ position: 'absolute', left: 80, right: 80, top: g.caption.top }}>
      <WordPop text={text} start={start} exit={exit} size={g.text} />
    </div>
  );
}

/** Mouse pointer, as in the reference's taps. */
function Pointer({ x, y, press }: { x: number; y: number; press: number }) {
  return (
    <svg
      width={58}
      height={58}
      viewBox="0 0 24 24"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `scale(${1 - press * 0.18})`,
        transformOrigin: '4px 3px',
      }}
    >
      <path
        d="M4 3l14.5 7.2-6.3 1.6 3.9 7.2-2.7 1.4-3.9-7.2L5 17.4z"
        fill="#fff"
        stroke={C.text}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Whip-pan: the content slides left fast with a directional blur made of trails. */
function Whip({ dx, v, children }: { dx: number; v: number; children: ReactNode }) {
  const n = Math.abs(v) > 4 ? 7 : 1;
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <AbsoluteFill
          key={i}
          style={{
            transform: `translateX(${dx + (i * v) / 2.2}px)`,
            opacity: n === 1 ? 1 : i === 0 ? 0.5 : 0.5 / (i + 1),
          }}
        >
          {children}
        </AbsoluteFill>
      ))}
    </>
  );
}

// ─── The video ───

function Rest({ layout }: { layout: Layout }) {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const g = geo(layout, W, H);

  // Background washes.
  const mint =
    Math.min(keys(f, [100, 112, 196, 214], [0, 1, 1, 0]), 1) +
    keys(f, [1044, 1058, 1136, 1148], [0, 1, 1, 0]);
  const glow = keys(
    f,
    [210, 244, 384, 410, 604, 632, 708, 724, 806, 840, 1032, 1050],
    [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0],
  );

  // Meet Uma: hold, slow push, then whip-pan left.
  const push = keys(f, [168, 200], [1, 1.12]);
  const whip = (t: number) =>
    interpolate(t, [198, 216], [0, -W * 1.35], {
      easing: easeIn,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  const meetSize = g.L ? 128 : 104;

  return (
    <AbsoluteFill style={{ fontFamily: FONT, overflow: 'hidden' }}>
      <Mint op={mint} />

      {/* 2. Meet Uma */}
      {f >= 116 && f < 220 && (
        <Whip dx={whip(f)} v={whip(f) - whip(f - 1)}>
          <AbsoluteFill
            style={{ alignItems: 'center', justifyContent: 'center', transform: `scale(${push})` }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: meetSize * 0.26 }}>
              <TypeIn
                text="Meet"
                start={120}
                size={meetSize}
                color={C.text}
                from={C.green}
                every={3}
              />
              <Logo size={meetSize * 1.02} start={134} />
              <TypeIn
                text="Uma"
                start={148}
                size={meetSize}
                color={C.green}
                from="#C9C9C4"
                every={3}
              />
            </div>
          </AbsoluteFill>
        </Whip>
      )}

      {/* 3–8. One morphing screen */}
      <Glow g={g} op={glow} />
      <QrCard g={g} />
      <Swoosh g={g} />
      <Screen poses={poses(g)}>
        {(src) => (
          <>
            {src === 'scan.png' && <ScanSweep rect={SCAN_WIN} start={268} />}
            {src === 'zone.png' && <Ring rect={MOIST_TXT} start={428} end={486} radius={30} />}
            {src === 'checkin.png' && <Ring rect={JUST_RIGHT} start={542} end={598} radius={60} />}
            {src === 'map.png' && <Ring rect={MAP_SUMMARY} start={860} end={908} radius={90} />}
            {src.startsWith('profile') && (
              <Ring rect={PROFILE_SYNC} start={936} end={1026} radius={70} />
            )}
          </>
        )}
      </Screen>

      <Labels g={g} left="Scan the" right="QR code." start={236} exit={316} />
      <Labels g={g} left="The zone" right="opens." start={334} exit={378} />
      <Caption
        g={g}
        text={g.L ? 'See its **soil moisture.**' : 'See its|**soil moisture.**'}
        start={420}
        exit={486}
      />
      <Count g={g} />
      <Caption
        g={g}
        text={g.L ? 'Moisture already **filled in.**' : 'Moisture already|**filled in.**'}
        start={532}
        exit={598}
      />
      <Labels g={g} left="Saved in a" right="few taps." start={646} exit={704} />
      <FocusList g={g} />
      <Labels g={g} left="The whole farm" right="at a glance." start={848} exit={910} />
      <Labels g={g} left="Works" right="offline." start={928} exit={966} />
      <Labels g={g} left="Syncs when" right="back online." start={980} exit={1028} />

      {/* 9. Languages: kinetic type */}
      {f >= 1046 && f < 1150 && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: 80 }}>
          <div style={{ display: 'grid', width: '100%' }}>
            <div style={{ gridArea: '1 / 1' }}>
              <WordPop text="In **three languages.**" start={1050} exit={1088} size={g.big} />
            </div>
            <div style={{ gridArea: '1 / 1' }}>
              <WordPop
                text={g.L ? 'Cebuano · **English** · Tagalog' : 'Cebuano|**English**|Tagalog'}
                start={1096}
                exit={1136}
                size={g.big}
                stagger={6}
              />
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* 10. Green CTA → arrow → white */}
      <Cta g={g} />

      {/* 11. End card */}
      {f >= 1220 && <End g={g} />}
    </AbsoluteFill>
  );
}

/** The real QR label (cropped from the app's QR screen) slides in beside the phone and is scanned. */
function QrCard({ g }: { g: G }) {
  const f = useCurrentFrame();
  const t = rise(f, 250, 18) * fall(f, 318, 14);
  if (t <= 0) return null;
  const w = g.L ? 300 : 300;
  const k = w / QR_LABEL.w;
  const x = g.L ? g.phone.cx - g.phone.w / 2 - w * 0.62 : g.phone.cx - g.phone.w / 2 - w * 0.35;
  const y = g.phone.cy + (g.L ? 60 : 160);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity: t,
        transform: `translateX(${(1 - rise(f, 250, 18)) * -160}px) rotate(-6deg)`,
        boxShadow: '0 30px 70px rgba(20,20,20,0.18)',
        borderRadius: 26,
        zIndex: 2,
      }}
    >
      <Clip src="qr.png" crop={QR_LABEL} width={w} radius={26} />
    </div>
  );
}

/** Thick green stroke sweeping across, carrying the card (the reference's swoosh). */
function Swoosh({ g }: { g: G }) {
  const f = useCurrentFrame();
  const p = interpolate(f, [488, 534], [0, 1], {
    easing: easeInOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (p <= 0 || p >= 1) return null;
  const { W, H } = g;
  const d = g.L
    ? `M ${-0.25 * W} ${0.95 * H} C ${0.25 * W} ${0.75 * H}, ${0.6 * W} ${0.55 * H}, ${1.25 * W} ${0.12 * H}`
    : `M ${-0.3 * W} ${0.82 * H} C ${0.3 * W} ${0.7 * H}, ${0.7 * W} ${0.45 * H}, ${1.3 * W} ${0.22 * H}`;
  const len = 0.5;
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke={C.green}
        strokeWidth={g.L ? 230 : 250}
        strokeLinecap="round"
        strokeDasharray={`${len} ${1 + len}`}
        strokeDashoffset={len - p * (1 + len)}
      />
    </svg>
  );
}

/** Count-up to the moisture value shown in the app. */
function Count({ g }: { g: G }) {
  const f = useCurrentFrame();
  const t = rise(f, 436, 14) * fall(f, 484, 10);
  if (t <= 0) return null;
  const n = Math.round(
    interpolate(f, [438, 468], [0, 54], {
      easing: easeOut,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const cardH = (g.card.w * ZONE_CARD.h) / ZONE_CARD.w;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: g.card.cy + cardH / 2 + (g.L ? 40 : 60),
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'center',
        gap: 24,
        opacity: t,
        transform: `translateY(${(1 - t) * 30}px)`,
      }}
    >
      <span style={{ fontSize: g.L ? 120 : 130, fontWeight: 600, color: C.text, lineHeight: 1 }}>
        {n}
        <span style={{ color: C.orange }}>%</span>
      </span>
      <span style={{ fontSize: g.L ? 34 : 34, color: C.muted, lineHeight: 1.3 }}>
        Soil moisture
        <br />
        Sample reading
      </span>
    </div>
  );
}

/** Zone pills (cropped from the real map) with a focus pull and a tap, like the reference's list. */
function FocusList({ g }: { g: G }) {
  const f = useCurrentFrame();
  if (f < 718 || f > 820) return null;
  const focus = rise(f, 770, 14);
  const press = interpolate(f, [794, 798, 804], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const z = pill(g, FOCUS, f);
  const cur = {
    x: interpolate(f, [772, 792], [z.cx + z.w, z.cx + z.w * 0.32], {
      easing: easeOut,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    y: interpolate(f, [772, 792], [z.cy + 220, z.cy - 6], {
      easing: easeOut,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  };
  return (
    <>
      {g.L ? (
        <div
          style={{
            position: 'absolute',
            left: 130,
            top: pill(g, 1, f).cy + pill(g, 1, f).h / 2 + g.list.gap / 2 - g.text * 1.15,
            width: 800,
          }}
        >
          <WordPop
            text="Spot the zone|**that needs water.**"
            start={728}
            exit={800}
            size={g.text}
            align="left"
          />
        </div>
      ) : (
        <div style={{ position: 'absolute', left: 60, right: 60, top: 400 }}>
          <WordPop
            text="Spot the zone|**that needs water.**"
            start={728}
            exit={800}
            size={g.text}
          />
        </div>
      )}
      {TAGS.map((crop, i) => {
        const p = pill(g, i, f);
        const t = rise(f, 722 + i * 5, 16);
        const isFocus = i === FOCUS;
        if (isFocus && f >= 806) return null;
        const others = fall(f, 800, 10);
        const scale = isFocus ? 1 + focus * 0.06 - press * 0.04 : 1 - focus * 0.04;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.cx - p.w / 2,
              top: p.cy - p.h / 2,
              opacity: t * (isFocus ? 1 : others * (1 - focus * 0.45)),
              filter: isFocus ? undefined : `blur(${focus * 5}px)`,
              transform: `translateY(${(1 - t) * 60}px) scale(${scale})`,
              boxShadow: isFocus ? `0 18px 50px rgba(22,146,63,${0.25 * focus})` : 'none',
              borderRadius: p.h / 2,
            }}
          >
            <Clip src="map.png" crop={crop} width={p.w} radius={p.h / 2} />
          </div>
        );
      })}
      {f >= 772 && f < 806 && <Pointer x={cur.x} y={cur.y} press={press} />}
    </>
  );
}

/** Green panel with a pill that collapses into its arrow; the arrow circle grows into white. */
function Cta({ g }: { g: G }) {
  const f = useCurrentFrame();
  if (f < 1140 || f > 1226) return null;
  const { W, H } = g;
  const reveal = interpolate(f, [1140, 1158], [0, 1], {
    easing: easeInOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pillIn = rise(f, 1154, 14);
  const collapse = interpolate(f, [1188, 1202], [0, 1], {
    easing: easeInOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const grow = interpolate(f, [1204, 1222], [0, 1], {
    easing: easeIn,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const h = g.L ? 104 : 100;
  const full = g.L ? 600 : 620;
  const w = full + (h - full) * collapse;
  const cover = (Math.hypot(W, H) / h) * 1.15;
  return (
    <AbsoluteFill
      style={{
        clipPath: `circle(${reveal * 75}% at 50% 50%)`,
        background: C.green,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: w,
          height: h,
          borderRadius: h / 2,
          background: C.white,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          overflow: 'hidden',
          opacity: pillIn,
          transform: `scale(${(0.6 + 0.4 * pillIn) * (1 + grow * (cover - 1))})`,
        }}
      >
        <span
          style={{
            flex: 1,
            paddingLeft: h * 0.42,
            fontSize: h * 0.36,
            fontWeight: 600,
            color: C.green,
            whiteSpace: 'nowrap',
            opacity: 1 - collapse * 1.6,
          }}
        >
          Watch every plant
        </span>
        <div
          style={{
            width: h * 0.72,
            height: h * 0.72,
            margin: h * 0.14,
            borderRadius: '50%',
            background: C.green,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            opacity: 1 - grow * 2,
          }}
        >
          <svg width={h * 0.4} height={h * 0.4} viewBox="0 0 24 24">
            <path
              d="M4 12h15M13 6l6 6-6 6"
              fill="none"
              stroke="#fff"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function End({ g }: { g: G }) {
  const f = useCurrentFrame();
  const logo = g.L ? 170 : 190;
  return (
    <AbsoluteFill
      style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}
    >
      <Logo size={logo} start={1228} />
      <div style={{ marginTop: 28 }}>
        <TypeIn
          text="Uma"
          start={1246}
          size={g.L ? 120 : 128}
          color={C.text}
          from="#C9C9C4"
          every={3}
        />
      </div>
      <div style={{ marginTop: 14, width: g.W - 120 }}>
        <WordPop text="Watch every plant. **Lose less.**" start={1258} size={g.L ? 48 : 52} />
      </div>
    </AbsoluteFill>
  );
}

/**
 * 1. Problem, paced like the voiceover: "Plants dry out … unnoticed." — pause —
 * "Which zone? … Checked when?" — a beat — then the rest of the video.
 */
function Intro({ layout }: { layout: Layout }) {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const g = geo(layout, W, H);
  if (f > 200) return null;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Mint op={keys(f, [0, 8], [0, 1])} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: 80 }}>
        <div style={{ display: 'grid', width: '100%' }}>
          <div style={{ gridArea: '1 / 1' }}>
            <WordPop
              text={g.L ? 'Plants dry out +16 **unnoticed.**' : 'Plants dry out|+16 **unnoticed.**'}
              start={8}
              exit={86}
              size={g.big}
            />
          </div>
          <div style={{ gridArea: '1 / 1' }}>
            <WordPop
              text={g.L ? 'Which zone? +14 **Checked when?**' : 'Which zone?|+14 **Checked when?**'}
              start={104}
              exit={164}
              size={g.big}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function Explainer({ layout }: { layout: Layout }) {
  return (
    <AbsoluteFill style={{ backgroundColor: C.white }}>
      <Intro layout={layout} />
      <Sequence from={INTRO_EXTRA} durationInFrames={TOTAL_FRAMES - INTRO_EXTRA} layout="none">
        <AbsoluteFill>
          <Rest layout={layout} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
}
