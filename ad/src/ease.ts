import { Easing, interpolate, spring } from 'remotion';

import { FPS } from './theme';

export const easeOut = Easing.bezier(0.33, 1, 0.68, 1); // ease-out cubic
export const easeIn = Easing.bezier(0.32, 0, 0.67, 0); // ease-in cubic

/** 0→1 over [start, start+duration] with ease-out cubic, clamped. */
export function rise(frame: number, start: number, duration = 18) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    easing: easeOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

/** 1→0 over [start, start+duration] with ease-in cubic, clamped. */
export function fall(frame: number, start: number, duration = 14) {
  return interpolate(frame, [start, start + duration], [1, 0], {
    easing: easeIn,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

/** Critically damped spring: settles without overshoot. */
export function calm(frame: number, delay = 0) {
  return spring({
    frame: frame - delay,
    fps: FPS,
    config: { damping: 200, stiffness: 120, mass: 1 },
  });
}
