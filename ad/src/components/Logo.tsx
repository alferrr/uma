import { interpolate, useCurrentFrame } from 'remotion';

import { easeInOut, rise } from '../ease';
import { C } from '../theme';

const R = 26;
const RING = 2 * Math.PI * R;

/**
 * The Uma sprout mark (same paths as assets/brand/uma-logo.svg). The ring draws
 * itself like the reference's logo, then the sprout grows in.
 */
export function Logo({ size, start, color = C.green }: { size: number; start: number; color?: string }) {
  const f = useCurrentFrame();
  const ring = interpolate(f, [start, start + 22], [0, 1], {
    easing: easeInOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sprout = rise(f, start + 12, 14);
  const dot = interpolate(f, [start - 6, start, start + 6], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" style={{ overflow: 'visible' }}>
      <circle cx={28} cy={54} r={3 * dot} fill={color} />
      <circle
        cx={28}
        cy={28}
        r={R}
        stroke={color}
        strokeWidth={2.4}
        strokeDasharray={RING}
        strokeDashoffset={RING * (1 - ring)}
        strokeLinecap="round"
        transform="rotate(90 28 28)"
        opacity={ring > 0 ? 1 : 0}
      />
      <g
        stroke={color}
        strokeWidth={2.4}
        opacity={sprout}
        transform={`translate(28 40) scale(${0.4 + 0.6 * sprout}) translate(-28 -40)`}
      >
        <path d="M28 40V22" strokeLinecap="round" />
        <path d="M28 30c-6.5 0-10-3.6-10-9.5 6.5 0 10 3.6 10 9.5Z" strokeLinejoin="round" />
        <path d="M28 27c0-5.9 3.5-9.5 10-9.5 0 5.9-3.5 9.5-10 9.5Z" strokeLinejoin="round" />
        <path d="M18 40h20" strokeLinecap="round" />
      </g>
    </svg>
  );
}
