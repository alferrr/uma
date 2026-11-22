import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FieldRows } from '@/components/art';
import { CheckIcon, ClockIcon } from '@/components/icons';
import { PrimaryButton } from '@/components/PrimaryButton';
import { unsyncedCount } from '@/lib/db';
import { useT } from '@/lib/i18n';
import type { Moisture, Status } from '@/lib/zones';
import { colors, fonts } from '@/theme';

const RETURN_AFTER = 3;

function goHome() {
  // Normal flow is Home → Zone → Saved; a deep link may have no Home behind it.
  if (router.canDismiss()) router.dismissTo('/home');
  else router.replace('/home');
}

/** Screen 10 · Saved. Returns home on its own (Scan is not built yet). */
export default function Saved() {
  const params = useLocalSearchParams<{
    code: string;
    status: Status;
    dead: string;
    moisture: Moisture;
  }>();
  const insets = useSafeAreaInsets();
  const t = useT();
  const [left, setLeft] = useState(RETURN_AFTER);
  const [pending] = useState(unsyncedCount);

  useEffect(() => {
    if (left <= 0) {
      goHome();
      return;
    }
    const timer = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  const parts = [params.code, t.status[params.status] ?? ''];
  if (params.status === 'dead') parts[1] = `${t.statusShort.dead}: ${params.dead}`;
  if (params.moisture) parts.push(t.moisture[params.moisture]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <FieldRows dark style={styles.field} />

      <View style={[styles.content, { paddingTop: insets.top + 70 }]}>
        <View style={styles.check}>
          <CheckIcon size={40} color={colors.green} strokeWidth={2.6} />
        </View>
        <Text style={styles.title} accessibilityRole="header" accessibilityLiveRegion="polite">
          <Text style={styles.titleStrong}>{t.checkSaved}</Text>
          {'\n'}
          {t.saved}
        </Text>
        <Text style={styles.summary}>{parts.join(' · ')}</Text>

        <View style={styles.sync}>
          <View style={[styles.syncIcon, pending === 0 && { backgroundColor: colors.green }]}>
            {pending === 0 ? (
              <CheckIcon size={14} color={colors.white} strokeWidth={2.4} />
            ) : (
              <ClockIcon size={14} color={colors.white} strokeWidth={2.2} />
            )}
          </View>
          <Text style={styles.syncText}>{pending === 0 ? t.allSynced : t.notSynced(pending)}</Text>
        </View>
      </View>

      <View style={[styles.cta, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton label={t.backNow} onPress={goHome} />
        <Text style={styles.countdown}>{t.returnsIn(Math.max(left, 0))}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B2A16' },
  field: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%' },
  content: { paddingHorizontal: 30 },
  check: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 30,
    fontFamily: fonts.regular,
    fontSize: 46,
    lineHeight: 54,
    color: colors.white,
    letterSpacing: -0.6,
  },
  titleStrong: { fontFamily: fonts.bold },
  summary: {
    marginTop: 16,
    fontFamily: fonts.regular,
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
  },
  sync: {
    marginTop: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 6,
    paddingRight: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  syncIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncText: { fontFamily: fonts.regular, fontSize: 15, color: colors.white },
  cta: { marginTop: 'auto', paddingHorizontal: 24, gap: 14 },
  countdown: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
});
