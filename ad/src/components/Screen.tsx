import { createContext, useContext, type ReactNode } from 'react';
import { Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import { easeInOut } from '../ease';
import { SHOT } from '../theme';

export type Crop = { x: number; y: number; w: number; h: number };
export const FULL: Crop = { x: 0, y: 0, w: SHOT.w, h: SHOT.h };

/** One pose of the morphing screen. Geometry is in stage pixels, crop in screenshot pixels. */
export type Pose = {
  f: number;
  src: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
  crop: Crop;
  /** Corner radius in stage px. */
  r: number;
  /** 0 = bare card, 1 = full phone bezel. */
  bezel: number;
  op?: number;
  rot?: number;
};

const NUM = ['cx', 'cy', 'w', 'h', 'r', 'bezel', 'op', 'rot'] as const;

/** Where we are between poses: the two poses and the eased progress between them. */
function at(poses: Pose[], f: number) {
  if (f <= poses[0]!.f) return { a: poses[0]!, b: poses[0]!, t: 0 };
  for (let i = 0; i < poses.length - 1; i++) {
    const a = poses[i]!;
    const b = poses[i + 1]!;
    if (f <= b.f) {
      const t = interpolate(f, [a.f, b.f], [0, 1], { easing: easeInOut });
      return { a, b, t };
    }
  }
  const last = poses[poses.length - 1]!;
  return { a: last, b: last, t: 1 };
}

const ShotScale = createContext(1);
/** Screenshot px → stage px for overlays drawn inside <Screen>. */
export const useShotScale = () => useContext(ShotScale);

/**
 * One continuous screen that morphs between poses: phone ↔ zoomed card ↔ phone,
 * crop and frame interpolate together, and a change of screenshot crossfades.
 * The screenshots are real app captures; nothing in them is redrawn.
 */
export function Screen({ poses, children }: { poses: Pose[]; children?: (src: string) => ReactNode }) {
  const f = useCurrentFrame();
  const { a, b, t } = at(poses, f);
  const v = Object.fromEntries(
    NUM.map((k) => [k, (a[k] ?? (k === 'op' ? 1 : 0)) + ((b[k] ?? (k === 'op' ? 1 : 0)) - (a[k] ?? (k === 'op' ? 1 : 0))) * t]),
  ) as Record<(typeof NUM)[number], number>;
  const crop: Crop = {
    x: a.crop.x + (b.crop.x - a.crop.x) * t,
    y: a.crop.y + (b.crop.y - a.crop.y) * t,
    w: a.crop.w + (b.crop.w - a.crop.w) * t,
    h: a.crop.h + (b.crop.h - a.crop.h) * t,
  };
  if (v.op <= 0.001) return null;

  // Cover-fit the crop into the box, centred, so aspect changes never stretch.
  const s = Math.max(v.w / crop.w, v.h / crop.h);
  const left = v.w / 2 - (crop.x + crop.w / 2) * s;
  const top = v.h / 2 - (crop.y + crop.h / 2) * s;
  const bez = v.bezel * v.w * 0.035;
  const swap = a.src !== b.src ? t : 0;
  // A crossfade with a slight scale "breath", so a screen change reads as a morph, not a cut.
  const breath = 1 + Math.sin(swap * Math.PI) * 0.025;

  const layer = (src: string, opacity: number) => (
    <div style={{ position: 'absolute', left, top, width: SHOT.w * s, height: SHOT.h * s, opacity }}>
      <Img src={staticFile(`screens/${src}`)} style={{ width: '100%', height: '100%' }} />
      <ShotScale.Provider value={s}>{children?.(src)}</ShotScale.Provider>
    </div>
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: v.cx - v.w / 2 - bez,
        top: v.cy - v.h / 2 - bez,
        padding: bez,
        borderRadius: v.r + bez,
        background: v.bezel > 0.01 ? `rgba(27,27,26,${Math.min(1, v.bezel * 1.4)})` : 'transparent',
        boxShadow: `0 ${30 + 20 * v.bezel}px 80px rgba(20,20,20,0.14), 0 8px 24px rgba(20,20,20,0.08)`,
        opacity: v.op,
        transform: `rotate(${v.rot}deg) scale(${breath})`,
      }}
    >
      <div style={{ position: 'relative', width: v.w, height: v.h, borderRadius: v.r, overflow: 'hidden', background: '#fff' }}>
        {swap > 0 && swap < 1 ? (
          <>
            {layer(a.src, 1)}
            {layer(b.src, swap)}
          </>
        ) : (
          layer(t >= 1 ? b.src : a.src, 1)
        )}
      </div>
    </div>
  );
}

/** A static crop of a real screenshot (for the focus-pull list). */
export function Clip({ src, crop, width, radius }: { src: string; crop: Crop; width: number; radius: number }) {
  const s = width / crop.w;
  return (
    <div style={{ position: 'relative', width, height: crop.h * s, borderRadius: radius, overflow: 'hidden' }}>
      <Img
        src={staticFile(`screens/${src}`)}
        style={{ position: 'absolute', width: SHOT.w * s, height: SHOT.h * s, left: -crop.x * s, top: -crop.y * s }}
      />
    </div>
  );
}
