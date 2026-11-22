/** Uma's design tokens, the same values as the app's src/theme. */
export const C = {
  green: '#16923F',
  orange: '#F7931E',
  text: '#141414',
  muted: '#6E6E6A',
  panel: '#F4F4F1',
  white: '#FFFFFF',
} as const;

export const FONT = 'Outfit';
export const FPS = 30;

/** Screenshot size from the iPhone simulator (3x). */
export const SHOT = { w: 1260, h: 2736 } as const;

export type Layout = 'landscape' | 'portrait';
