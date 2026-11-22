import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FieldRows, GreenStripes } from '@/components/art';
import { LeafLogo } from '@/components/icons';
import { SlideButton } from '@/components/SlideButton';
import { colors, fonts } from '@/theme';

/** Screen 1 · Welcome */
export default function Welcome() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <FieldRows style={styles.field} />

      <View style={[styles.content, { paddingTop: insets.top + 24 }]}>
        <LeafLogo size={58} />

        <View style={styles.headline} accessibilityRole="header">
          <Text style={styles.line}>
            <Text style={styles.strong}>Watch</Text> Every Plant
          </Text>
          <View style={styles.row}>
            <View style={styles.thumb} accessible={false}>
              <GreenStripes />
            </View>
            <Text style={styles.line}>
              Lose <Text style={styles.strong}>Less</Text>
            </Text>
          </View>
        </View>

        <Text style={styles.body}>
          Know which zone needs water or has dead plants, even with no signal in the field.
        </Text>
      </View>

      <View style={[styles.cta, { paddingBottom: insets.bottom + 20 }]}>
        <SlideButton label="Get Started" onComplete={() => router.push('/sign-in')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  field: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '68%' },
  content: { paddingHorizontal: 30 },
  headline: { marginTop: 22, gap: 4 },
  line: {
    fontFamily: fonts.regular,
    fontSize: 40,
    lineHeight: 48,
    color: colors.text,
    letterSpacing: -0.8,
  },
  strong: { fontFamily: fonts.bold, color: colors.green },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 92, height: 44, borderRadius: 22, overflow: 'hidden' },
  body: {
    marginTop: 26,
    maxWidth: 360,
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 28,
    color: '#3B3B38',
  },
  cta: { marginTop: 'auto', paddingHorizontal: 24 },
});
