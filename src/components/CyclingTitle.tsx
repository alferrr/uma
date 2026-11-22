import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text } from 'react-native';

import { colors, fonts } from '@/theme';

const PHRASES = [
  { lead: 'Choose your', strong: 'Language' },
  { lead: 'Pilia ang imong', strong: 'Pinulongan' },
  { lead: 'Piliin ang iyong', strong: 'Wika' },
];

const HOLD_MS = 2200;
const FADE_MS = 350;

/**
 * "Choose your Language" in English, Bisaya and Tagalog in turn, fading out and
 * in. It stays on English for people who have reduce-motion turned on.
 */
export function CyclingTitle() {
  const [index, setIndex] = useState(0);
  const [opacity] = useState(() => new Animated.Value(1));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const next = () => {
      timer = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(
          ({ finished }) => {
            if (!finished || cancelled) return;
            setIndex((i) => (i + 1) % PHRASES.length);
            Animated.timing(opacity, {
              toValue: 1,
              duration: FADE_MS,
              useNativeDriver: true,
            }).start(() => {
              if (!cancelled) next();
            });
          },
        );
      }, HOLD_MS);
    };
    next();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      opacity.stopAnimation();
      opacity.setValue(1);
    };
  }, [opacity, reduceMotion]);

  const phrase = reduceMotion ? PHRASES[0]! : PHRASES[index]!;

  return (
    // One steady label so a screen reader does not re-announce on every change.
    <Animated.View
      style={{ opacity }}
      accessible
      accessibilityRole="header"
      accessibilityLabel="Choose your language. Pilia ang imong pinulongan. Piliin ang iyong wika."
    >
      <Text style={styles.title}>
        {phrase.lead}
        {'\n'}
        <Text style={styles.strong}>{phrase.strong}</Text>
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Two lines at a fixed height so the list below never jumps between phrases.
  title: {
    minHeight: 92,
    marginTop: 22,
    fontFamily: fonts.regular,
    fontSize: 38,
    lineHeight: 46,
    color: colors.text,
    letterSpacing: -0.6,
  },
  strong: { fontFamily: fonts.bold, color: colors.green },
});
