import { interpolate, useCurrentFrame } from 'remotion';

import { easeOut, fall, rise } from '../ease';
import { C } from '../theme';
import { useShotScale, type Crop } from './Screen';

/** Orange highlight ring over part of the real screenshot (screenshot px). */
export function Ring({ rect, start, end, radius = 40 }: { rect: Crop; start: number; end?: number; radius?: number }) {
  const f = useCurrentFrame();
  const s = useShotScale();
  const t = rise(f, start, 14) * (end === undefined ? 1 : fall(f, end, 10));
  if (t <= 0) return null;
  const pad = 22;
  return (
    <div
      style={{
        position: 'absolute',
        left: (rect.x - pad) * s,
        top: (rect.y - pad) * s,
        width: (rect.w + pad * 2) * s,
        height: (rect.h + pad * 2) * s,
        borderRadius: radius * s,
        border: `${Math.max(3, 10 * s)}px solid ${C.orange}`,
        boxShadow: `0 0 ${50 * s}px rgba(247,147,30,${0.5 * t})`,
        opacity: t,
        transform: `scale(${interpolate(t, [0, 1], [1.15, 1], { easing: easeOut })})`,
      }}
    />
  );
}

/** Green scan line sweeping down a rect of the screenshot. */
export function ScanSweep({ rect, start, sweeps = 2 }: { rect: Crop; start: number; sweeps?: number }) {
  const f = useCurrentFrame();
  const s = useShotScale();
  const per = 24;
  const local = f - start;
  if (local < 0 || local > per * sweeps) return null;
  const p = (local % per) / per;
  return (
    <div
      style={{
        position: 'absolute',
        left: (rect.x + 40) * s,
        top: (rect.y + rect.h * p) * s,
        width: (rect.w - 80) * s,
        height: Math.max(3, 8 * s),
        borderRadius: 4,
        background: C.green,
        boxShadow: `0 0 ${36 * s}px ${C.green}`,
        opacity: 1 - Math.abs(p - 0.5) * 1.4,
      }}
    />
  );
}
