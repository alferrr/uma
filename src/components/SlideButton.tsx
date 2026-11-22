import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { useT } from '@/lib/i18n';
import { colors, fonts, radius } from '@/theme';
import { ArrowRight, Chevrons } from './icons';

const KNOB = 54;
const PAD = 7;

type Props = {
  label: string;
  onComplete: () => void;
};

/**
 * Frosted slide-to-continue pill. Drag the white circle across, or tap it
 * (and use the standard accessibility activate action) to continue.
 */
export function SlideButton({ label, onComplete }: Props) {
  const t = useT();
  const [width, setWidth] = useState(0);
  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  // All gesture state lives in one lazily-created object. completeRef is only read after
  // the animation finishes, never during render; the lint rule can't see through the closure.
  // eslint-disable-next-line react-hooks/refs
  const [slider] = useState(() => {
    const x = new Animated.Value(0);
    let max = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      Animated.timing(x, { toValue: max, duration: 120, useNativeDriver: true }).start(() => {
        completeRef.current();
        // Reset so the slider is ready again if the user navigates back.
        setTimeout(() => {
          x.setValue(0);
          done = false;
        }, 400);
      });
    };
    const back = () => Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();

    const pan = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => x.setValue(Math.min(Math.max(g.dx, 0), max)),
      onPanResponderRelease: (_, g) => {
        const tapped = Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6;
        if (tapped || g.dx > max * 0.7) finish();
        else back();
      },
      onPanResponderTerminate: back,
    });

    return { x, pan, finish, setMax: (w: number) => (max = Math.max(0, w - KNOB - PAD * 2)) };
  });

  function onLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    setWidth(w);
    slider.setMax(w);
  }

  const labelOpacity = slider.x.interpolate({
    inputRange: [0, Math.max(1, width * 0.45)],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View
      onLayout={onLayout}
      style={styles.track}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={t.slideHint}
      onAccessibilityTap={slider.finish}
    >
      {Platform.OS === 'ios' && (
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      <Animated.Text style={[styles.label, { opacity: labelOpacity }]}>{label}</Animated.Text>
      <View style={styles.chevrons} pointerEvents="none">
        <Chevrons />
      </View>
      <Animated.View
        style={[styles.knob, { transform: [{ translateX: slider.x }] }]}
        {...slider.pan.panHandlers}
      >
        <ArrowRight />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: KNOB + PAD * 2,
    borderRadius: radius.pill,
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(10,50,24,0.35)' : 'rgba(10,50,24,0.6)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  knob: {
    position: 'absolute',
    left: PAD,
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 19,
  },
  chevrons: { position: 'absolute', right: PAD + 10 },
});
