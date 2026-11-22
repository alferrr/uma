export const colors = {
  green: '#16923F',
  greenDark: '#0E6A2C',
  orange: '#F7931E',
  bg: '#F4F4F1',
  surface: '#FFFFFF',
  text: '#141414',
  muted: '#6E6E6A',
  placeholder: '#9A9A95',
  danger: '#C2410C',
  white: '#FFFFFF',
} as const;

export const fonts = {
  light: 'Outfit_300Light',
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
} as const;

export const radius = {
  pill: 999,
  sheet: 32,
} as const;

/** Status always pairs one of these with an icon and a word, never color alone. */
export const statusColors = {
  ok: '#2FBF5B',
  needs_water: '#F7931E',
  dead: '#E5484D',
  not_checked: '#B8B8B2',
} as const;
