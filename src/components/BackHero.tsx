import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useT } from '@/lib/i18n';
import { colors, fonts } from '@/theme';
import { ChevronLeft } from './icons';

/** Back button and a two-line title ("Join a / farm") for AuthLayout heroes. */
export function BackHero({ lead, strong }: { lead?: string; strong: string }) {
  const t = useT();
  return (
    <>
      <StatusBar style="light" />
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.back, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel={t.back}
        hitSlop={8}
      >
        <ChevronLeft />
      </Pressable>
      <Text style={styles.title} accessibilityRole="header" numberOfLines={2}>
        {lead ? `${lead}\n` : ''}
        <Text style={styles.strong}>{strong}</Text>
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  back: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  title: {
    fontFamily: fonts.light,
    fontSize: 36,
    lineHeight: 42,
    color: colors.white,
    letterSpacing: -0.5,
  },
  strong: { fontFamily: fonts.bold },
});
