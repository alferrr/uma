import { Easing, interpolate } from 'remotion';

export const easeOut = Easing.bezier(0.33, 1, 0.68, 1); // ease-out cubic
export const easeIn = Easing.bezier(0.32, 0, 0.67, 0); // ease-in cubic
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1); // for morphs

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** 0→1 over [start, start+duration], ease-out, clamped. */
export const rise = (f: number, start: number, duration = 16) =>
  interpolate(f, [start, start + duration], [0, 1], { easing: easeOut, ...clamp });

/** 1→0 over [start, start+duration], ease-in, clamped. */
export const fall = (f: number, start: number, duration = 12) =>
  interpolate(f, [start, start + duration], [1, 0], { easing: easeIn, ...clamp });

/** Piecewise keyframes with ease-in-out between each pair. */
export const keys = (f: number, at: number[], values: number[]) =>
  interpolate(f, at, values, { easing: easeInOut, ...clamp });
