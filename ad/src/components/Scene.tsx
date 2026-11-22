import type { ReactNode } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

import { easeIn, fall, rise } from '../ease';

/** One beat (transparent, so beats crossfade over the white root): eases in, eases out, optional push-in exit like the reference. */
export function Scene({
  duration,
  children,
  pushIn = false,
  fade = 10,
}: {
  duration: number;
  children: ReactNode;
  pushIn?: boolean;
  fade?: number;
}) {
  const f = useCurrentFrame();
  const enter = rise(f, 0, fade);
  const exit = fall(f, duration - fade, fade);
  // Push-in: scale up and blur over the last 14 frames, carrying into the next beat.
  const push = pushIn
    ? interpolate(f, [duration - 14, duration], [0, 1], {
        easing: easeIn,
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          opacity: enter * exit,
          transform: `translateY(${(1 - enter) * 16}px) scale(${1 + push * 0.9})`,
          filter: push > 0 ? `blur(${push * 14}px)` : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
