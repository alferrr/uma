import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GreenStripes } from '@/components/art';
import {
  CheckIcon,
  ChevronLeft,
  ClockIcon,
  DropIcon,
  MinusIcon,
  PlusIcon,
  SproutIcon,
  WarningIcon,
} from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { getUser } from '@/lib/auth';
import { addCheckIn, useZone, type CheckInStatus } from '@/lib/db';
import { useT } from '@/lib/i18n';
import { syncNow } from '@/lib/sync';
import type { Moisture } from '@/lib/zones';
import { colors, fonts, radius } from '@/theme';

const STATUSES: { value: CheckInStatus; icon: (c: string) => ReactNode }[] = [
  { value: 'ok', icon: (c) => <CheckIcon color={c} size={22} /> },
  { value: 'needs_water', icon: (c) => <DropIcon color={c} size={22} /> },
  { value: 'dead', icon: (c) => <WarningIcon color={c} size={22} /> },
];

const MOISTURES: { value: Moisture; icon: (c: string) => ReactNode }[] = [
  { value: 'wet', icon: (c) => <DropIcon color={c} size={22} /> },
  { value: 'ok', icon: (c) => <SproutIcon color={c} size={22} /> },
  { value: 'dry', icon: (c) => <ClockIcon color={c} size={22} /> },
];

/** Screen 9 · Check-in */
export default function CheckIn() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const zone = useZone(id);
  const insets = useSafeAreaInsets();
  const t = useT();

  const [status, setStatus] = useState<CheckInStatus | null>(null);
  const [dead, setDead] = useState(1);
  const [moisture, setMoisture] = useState<Moisture | null>(null);

  if (!zone) return null;

  const ready = !!status && !!moisture;

  function save() {
    if (!zone || !status || !moisture) return;
    const row = addCheckIn({
      zone_id: zone.id,
      worker_id: getUser()?.contact ?? null,
      status,
      dead_count: status === 'dead' ? dead : 0,
      moisture,
      source: 'finger',
    });
    syncNow(); // Upload now if there is signal; otherwise it waits on the phone.
    router.replace({
      pathname: '/saved',
      params: {
        code: zone.code,
        status: row.status,
        dead: String(row.dead_count),
        moisture: row.moisture,
      },
    });
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        bounces={false}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <GreenStripes style={StyleSheet.absoluteFill} />
          <View style={[styles.heroBar, { paddingTop: insets.top + 8 }]}>
            <IconButton label="Back" onPress={() => router.back()}>
              <ChevronLeft />
            </IconButton>
            <View style={styles.pill}>
              <View style={styles.pillThumb}>
                <GreenStripes />
              </View>
              <View>
                <Text style={styles.pillTitle}>{zone.code}</Text>
                <Text style={styles.pillSub}>{t.checkIn}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.question} accessibilityRole="header">
            {t.whatsThe} <Text style={styles.questionStrong}>{t.statusQ}</Text>
          </Text>

          <View style={styles.options} accessibilityRole="radiogroup">
            {STATUSES.map((s) => {
              const on = status === s.value;
              const tint = s.value === 'dead' ? colors.orange : colors.green;
              return (
                <Pressable
                  key={s.value}
                  onPress={() => setStatus(s.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on, selected: on }}
                  style={({ pressed }) => [
                    styles.option,
                    on && styles.optionOn,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.optionIcon, on && styles.optionIconOn]}>
                    {s.icon(on ? tint : colors.text)}
                  </View>
                  <Text style={[styles.optionText, on && styles.white]}>{t.status[s.value]}</Text>
                </Pressable>
              );
            })}
          </View>

          {status === 'dead' && (
            <View style={styles.stepper}>
              <Pressable
                onPress={() => setDead((n) => Math.max(1, n - 1))}
                accessibilityRole="button"
                accessibilityLabel="−1"
                style={[styles.stepBtn, styles.stepMinus]}
              >
                <MinusIcon size={22} color={colors.text} />
              </Pressable>
              <View
                style={styles.stepMid}
                accessible
                accessibilityLabel={`${t.howManyDead} ${dead}`}
              >
                <Text style={styles.stepLabel}>{t.howManyDead}</Text>
                <Text style={styles.stepValue}>{dead}</Text>
              </View>
              <Pressable
                onPress={() => setDead((n) => Math.min(999, n + 1))}
                accessibilityRole="button"
                accessibilityLabel="+1"
                style={[styles.stepBtn, styles.stepPlus]}
              >
                <PlusIcon size={22} color={colors.white} />
              </Pressable>
            </View>
          )}

          <View style={styles.moistureHead}>
            <Text style={styles.section}>{t.soilMoisture}</Text>
          </View>
          <View style={styles.tiles} accessibilityRole="radiogroup">
            {MOISTURES.map((m) => {
              const on = moisture === m.value;
              return (
                <Pressable
                  key={m.value}
                  onPress={() => setMoisture(m.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on, selected: on }}
                  style={({ pressed }) => [
                    styles.tile,
                    on && styles.tileOn,
                    pressed && styles.pressed,
                  ]}
                >
                  {m.icon(on ? colors.white : colors.text)}
                  <Text style={[styles.tileText, on && styles.white]}>{t.moisture[m.value]}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.cta}>
            <PrimaryButton label={t.save} onPress={save} disabled={!ready} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { height: 230, overflow: 'hidden' },
  heroBar: {
    paddingHorizontal: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 6,
    paddingRight: 20,
    borderRadius: 34,
    backgroundColor: 'rgba(20,40,20,0.5)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  pillThumb: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden' },
  pillTitle: { fontFamily: fonts.semibold, fontSize: 19, color: colors.white },
  pillSub: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  sheet: {
    flex: 1,
    marginTop: -radius.sheet - 8,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 22,
    paddingTop: 30,
  },
  question: { fontFamily: fonts.medium, fontSize: 26, color: colors.text, marginBottom: 16 },
  questionStrong: { fontFamily: fonts.bold, color: colors.green },
  options: { gap: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    padding: 8,
    borderRadius: 40,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  optionOn: { backgroundColor: colors.orange },
  pressed: { transform: [{ scale: 0.98 }] },
  optionIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconOn: { backgroundColor: colors.white },
  optionText: { fontFamily: fonts.regular, fontSize: 20, color: colors.text },
  white: { color: colors.white },
  stepper: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 40,
    backgroundColor: colors.surface,
  },
  stepBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepMinus: { backgroundColor: colors.bg },
  stepPlus: { backgroundColor: colors.green },
  stepMid: { flex: 1, alignItems: 'center' },
  stepLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  stepValue: { fontFamily: fonts.medium, fontSize: 30, color: colors.text },
  moistureHead: {
    marginTop: 26,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: { fontFamily: fonts.medium, fontSize: 22, color: colors.text },
  tiles: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1,
    height: 110,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  tileOn: { backgroundColor: colors.orange },
  tileText: { fontFamily: fonts.medium, fontSize: 17, color: colors.text },
  cta: { marginTop: 26 },
});
