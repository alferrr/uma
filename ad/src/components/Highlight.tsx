import { interpolate, useCurrentFrame } from 'remotion';

import { easeOut, fall, rise } from '../ease';
import { C, FONT } from '../theme';
import { useShotScale } from './DeviceFrame';

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Orange ring over part of a real screenshot (screenshot pixels). The rest of
 * the screen softens to white, like the reference's focus pull. Nothing is redrawn.
 */
export function Highlight({
  rect,
  start,
  end,
  radius = 40,
}: {
  rect: Rect;
  start: number;
  end?: number;
  radius?: number;
}) {
  const f = useCurrentFrame();
  const s = useShotScale();
  const t = rise(f, start, 16) * (end === undefined ? 1 : fall(f, end, 10));
  const grow = interpolate(t, [0, 1], [1.12, 1]);
  const pad = 14 * s * 3;
  return (
    <div
      style={{
        position: 'absolute',
        left: (rect.x - pad / s / 2) * s,
        top: (rect.y - pad / s / 2) * s,
        width: rect.w * s + pad,
        height: rect.h * s + pad,
        borderRadius: radius * s,
        border: `${Math.max(3, 9 * s)}px solid ${C.orange}`,
        boxShadow: `0 0 0 4000px rgba(255,255,255,${0.32 * t}), 0 0 ${40 * s}px rgba(247,147,30,${0.45 * t})`,
        opacity: t,
        transform: `scale(${grow})`,
      }}
    />
  );
}

/** A card beside the phone with a number counting up to the value shown in the app. */
export function Callout({
  value,
  suffix = '',
  label,
  note,
  start,
  size = 1,
}: {
  value: number;
  suffix?: string;
  label: string;
  note?: string;
  start: number;
  size?: number;
}) {
  const f = useCurrentFrame();
  const t = rise(f, start, 16);
  const n = Math.round(
    interpolate(f, [start + 4, start + 34], [0, value], {
      easing: easeOut,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  return (
    <div
      style={{
        fontFamily: FONT,
        background: C.panel,
        borderRadius: 36 * size,
        padding: `${26 * size}px ${34 * size}px`,
        opacity: t,
        transform: `translateY(${(1 - t) * 24}px)`,
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 4 * size,
      }}
    >
      <div style={{ fontSize: 104 * size, fontWeight: 600, color: C.text, lineHeight: 1 }}>
        {n}
        <span style={{ color: C.orange }}>{suffix}</span>
      </div>
      <div style={{ fontSize: 30 * size, fontWeight: 500, color: C.text }}>{label}</div>
      {note && <div style={{ fontSize: 24 * size, fontWeight: 400, color: C.muted }}>{note}</div>}
    </div>
  );
}

/** Thin green line sweeping down over a rect of the screenshot, as a scan cue. */
export function ScanLine({ rect, start, sweeps = 2 }: { rect: Rect; start: number; sweeps?: number }) {
  const f = useCurrentFrame();
  const s = useShotScale();
  const per = 26;
  const local = f - start;
  if (local < 0 || local > per * sweeps) return null;
  const p = (local % per) / per;
  const fade = 1 - Math.abs(p - 0.5) * 1.2;
  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x * s + 20 * s,
        top: (rect.y + rect.h * p) * s,
        width: rect.w * s - 40 * s,
        height: Math.max(2, 7 * s),
        borderRadius: 4,
        background: C.green,
        boxShadow: `0 0 ${30 * s}px ${C.green}`,
        opacity: fall(f, start + per * sweeps - 8, 8) * fade,
      }}
    />
  );
}
