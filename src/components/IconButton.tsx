import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  children: ReactNode;
  /** `glass` sits over imagery; `light` is a white circle on plain backgrounds. */
  variant?: 'glass' | 'light';
  size?: number;
};

export function IconButton({ label, onPress, children, variant = 'glass', size = 58 }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        variant === 'glass' ? styles.glass : styles.light,
        pressed && { opacity: 0.75 },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  glass: {
    backgroundColor: 'rgba(20,40,20,0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  light: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
});
