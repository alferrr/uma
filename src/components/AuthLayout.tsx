import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '@/theme';

type Props = {
  /** Full-bleed artwork behind the hero. */
  art: ReactNode;
  /** Logo, back button and headline drawn over the art. */
  hero: ReactNode;
  /** Share of screen height the hero takes. */
  heroRatio: number;
  children: ReactNode;
  footer?: ReactNode;
};

/** Photo hero on top, white rounded sheet with the form below. */
export function AuthLayout({ art, hero, heroRatio, children, footer }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroHeight = Math.round(height * heroRatio);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        bounces={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { height: heroHeight + radius.sheet }]}>
          <View style={StyleSheet.absoluteFill}>{art}</View>
          <View style={[styles.heroContent, { paddingTop: insets.top + 20 }]}>{hero}</View>
        </View>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          {children}
          {footer && <View style={styles.footer}>{footer}</View>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { flexGrow: 1 },
  hero: { overflow: 'hidden', backgroundColor: colors.greenDark },
  heroContent: {
    flex: 1,
    paddingHorizontal: 30,
    paddingBottom: radius.sheet + 28,
    justifyContent: 'space-between',
  },
  sheet: {
    flex: 1,
    marginTop: -radius.sheet,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  footer: { marginTop: 'auto', paddingTop: 32, alignItems: 'center' },
});
