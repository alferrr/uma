import { BlurView } from 'expo-blur';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/theme';
import { ArrowRight, Chevrons } from './icons';

type Props = {
  label: string;
  onPress: () => void;
  /** `glass` sits over imagery (Welcome); `solid` is the green action on sheets. */
  variant?: 'solid' | 'glass';
  loading?: boolean;
  disabled?: boolean;
};

/** Rounded pill with a white arrow circle and `>>>`, from the Uma design. */
export function PillButton({ label, onPress, variant = 'solid', loading, disabled }: Props) {
  const glass = variant === 'glass';
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        glass ? styles.glass : styles.solid,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {glass && Platform.OS === 'ios' && (
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      <View style={styles.circle}>
        {loading ? <ActivityIndicator color={colors.green} /> : <ArrowRight />}
      </View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chevrons}>
        <Chevrons />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 68,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    overflow: 'hidden',
  },
  solid: { backgroundColor: colors.green },
  glass: {
    // Android/web fallback; iOS draws a real blur underneath.
    backgroundColor: Platform.OS === 'ios' ? 'rgba(10,50,24,0.35)' : 'rgba(10,50,24,0.6)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  disabled: { opacity: 0.5 },
  circle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    textAlign: 'center',
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 19,
  },
  chevrons: { width: 54, alignItems: 'center' },
});
