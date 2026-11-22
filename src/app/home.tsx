import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CropTile, SunsetField } from '@/components/art';
import { ChevronRight, DropIcon, SearchIcon, SproutIcon } from '@/components/icons';
import { ZoneCard } from '@/components/ZoneCard';
import { getUser, signOut } from '@/lib/auth';
import { useZones } from '@/lib/db';
import { useLanguage, useT } from '@/lib/i18n';
import { byAttention, moistureFromPercent, READINGS, toneFor, type Status } from '@/lib/zones';
import { colors, fonts } from '@/theme';

type Filter = 'all' | Exclude<Status, 'ok'>;
const FILTERS: Filter[] = ['all', 'needs_water', 'dead', 'not_checked'];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

const LOCALE = { en: 'en-GB', ceb: 'en-GB', tl: 'fil-PH' } as const;

/** Screen 5 · Home */
export default function Home() {
  const insets = useSafeAreaInsets();
  const t = useT();
  const lang = useLanguage() ?? 'en';
  const zones = useZones();
  const user = getUser();
  const name = user?.name ?? 'Owner';

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [hour, setHour] = useState(2);

  const now = new Date();
  const h = now.getHours();
  const greeting = h < 12 ? t.goodMorning : h < 18 ? t.goodAfternoon : t.goodEvening;
  const today = now.toLocaleDateString(LOCALE[lang], {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const reading = READINGS[Math.min(hour, READINGS.length - 1)];
  const level = reading ? moistureFromPercent(reading.percent) : null;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return zones
      .filter((z) => filter === 'all' || z.status === filter)
      .filter((z) => !q || `${z.code} ${z.area} ${z.row}`.toLowerCase().includes(q))
      .sort(byAttention);
  }, [zones, filter, query]);

  function accountMenu() {
    Alert.alert(name, user?.contact, [
      { text: t.changeLanguage, onPress: () => router.push('/language') },
      {
        text: t.signOut,
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
      { text: t.cancel, style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <SunsetField style={StyleSheet.absoluteFill} />
          <View style={[styles.heroInner, { paddingTop: insets.top + 12 }]}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting} numberOfLines={1}>
                  {greeting}, {name.split(' ')[0]}
                </Text>
                <Text style={styles.date}>{today}</Text>
              </View>
              <Pressable
                onPress={accountMenu}
                accessibilityRole="button"
                accessibilityLabel={t.account}
                style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.75 }]}
              >
                <Text style={styles.avatarText}>{initials(name) || 'U'}</Text>
              </Pressable>
            </View>

            <Text style={styles.headline} accessibilityRole="header">
              {t.heroLine1}
              {'\n'}
              {t.heroLine2}
            </Text>

            <View style={styles.search}>
              <SearchIcon size={20} color={colors.white} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t.searchZones}
                placeholderTextColor="rgba(255,255,255,0.7)"
                accessibilityLabel={t.searchZones}
                style={styles.searchInput}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
              />
            </View>
          </View>
        </View>

        {/* Moisture card: only when a sensor has reported */}
        {reading && level && (
          <View style={styles.moistureCard}>
            <SunsetField style={StyleSheet.absoluteFill} />
            <View style={styles.moistureShade} />
            <View style={styles.moistureBody}>
              <View style={styles.hours} accessibilityRole="tablist">
                {READINGS.map((r, i) => {
                  const on = i === hour;
                  return (
                    <Pressable
                      key={r.hour}
                      onPress={() => setHour(i)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`${r.hour}:00, ${r.percent}%`}
                      style={[styles.hourPill, on && styles.hourPillOn]}
                    >
                      <Text style={styles.hourText}>{r.hour}</Text>
                      <DropIcon size={18} color={colors.white} />
                      <Text style={styles.hourPct}>{r.percent}%</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.cardDate}>{today}</Text>
              <View style={styles.readingRow}>
                <Text style={styles.bigPct}>{reading.percent}%</Text>
                <View style={styles.levelRow}>
                  <DropIcon size={16} color="#F3D27A" />
                  <Text style={styles.levelText}>{t.moistureLabel[level]}</Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <View style={styles.levelRow}>
                  <SproutIcon size={16} color={colors.white} />
                  <Text style={styles.footerText}>{t.soilMoisture} · POT-01</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((f) => {
            const on = f === filter;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.chip, on && styles.chipOn]}
              >
                <View style={styles.chipThumb}>
                  <CropTile tone={f === 'all' ? 'green' : toneFor(f)} />
                </View>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  {f === 'all' ? t.all : t.statusShort[f]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Zones */}
        <View style={styles.sectionHead}>
          <Text style={styles.section} accessibilityRole="header">
            {t.myZones}
          </Text>
          <Pressable
            onPress={() => router.push('/map')}
            accessibilityRole="link"
            hitSlop={10}
            style={styles.seeAll}
          >
            <Text style={styles.seeAllText}>{t.seeAll}</Text>
            <ChevronRight size={16} color={colors.muted} />
          </Pressable>
        </View>

        <View style={styles.cards}>
          {shown.length === 0 ? (
            <Text style={styles.empty}>{zones.length === 0 ? t.noZonesYet : t.noZones}</Text>
          ) : (
            shown.map((z) => (
              <ZoneCard key={z.id} zone={z} onPress={() => router.push(`/zone/${z.id}`)} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { height: 470, overflow: 'hidden' },
  heroInner: { flex: 1, paddingHorizontal: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting: { fontFamily: fonts.medium, fontSize: 24, color: colors.white },
  date: { marginTop: 4, fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { fontFamily: fonts.semibold, fontSize: 18, color: colors.white },
  headline: {
    marginTop: 34,
    fontFamily: fonts.medium,
    fontSize: 30,
    lineHeight: 40,
    color: colors.white,
    letterSpacing: -0.3,
  },
  search: {
    marginTop: 26,
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.regular,
    fontSize: 17,
    color: colors.white,
  },
  moistureCard: {
    marginTop: -78,
    marginHorizontal: 18,
    borderRadius: 32,
    overflow: 'hidden',
  },
  moistureBody: { padding: 18 },
  moistureShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(40,28,10,0.55)',
  },
  hours: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  hourPill: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  hourPillOn: { backgroundColor: colors.orange, borderColor: colors.orange },
  hourText: { fontFamily: fonts.regular, fontSize: 14, color: colors.white },
  hourPct: { fontFamily: fonts.semibold, fontSize: 16, color: colors.white },
  cardDate: {
    marginTop: 18,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  readingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bigPct: { fontFamily: fonts.semibold, fontSize: 44, color: colors.white },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  levelText: { fontFamily: fonts.regular, fontSize: 15, color: colors.white },
  cardFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerText: { fontFamily: fonts.regular, fontSize: 14, color: colors.white },
  filters: { gap: 12, paddingHorizontal: 18, paddingVertical: 22 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 64,
    paddingLeft: 6,
    paddingRight: 22,
    borderRadius: 32,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.orange },
  chipThumb: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden' },
  chipText: { fontFamily: fonts.medium, fontSize: 17, color: colors.text },
  chipTextOn: { color: colors.white },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  section: { fontFamily: fonts.medium, fontSize: 24, color: colors.text },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAllText: { fontFamily: fonts.regular, fontSize: 16, color: colors.muted },
  cards: { paddingHorizontal: 18, gap: 16 },
  empty: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.muted,
    paddingVertical: 30,
  },
});
