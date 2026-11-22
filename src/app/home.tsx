import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CropTile, SunsetField } from '@/components/art';
import { ChevronRight, DropIcon, PlusIcon, SearchIcon, SproutIcon } from '@/components/icons';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SunsetPanel } from '@/components/SunsetPanel';
import { WeatherCard } from '@/components/WeatherCard';
import { ZoneCard } from '@/components/ZoneCard';
import { getUser, signOut } from '@/lib/auth';
import { useZones } from '@/lib/db';
import { useLanguage, useT } from '@/lib/i18n';
import { syncNow } from '@/lib/sync';
import { refreshWeather } from '@/lib/weather';
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
  const isOwner = user?.role === 'owner';
  const name = user?.name ?? 'Owner';

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [hour, setHour] = useState(2);
  const [refreshing, setRefreshing] = useState(false);

  // Pull zones and push saved check-ins when Home opens.
  useEffect(() => {
    syncNow();
  }, []);

  async function refresh() {
    setRefreshing(true);
    await Promise.all([syncNow(), refreshWeather()]);
    setRefreshing(false);
  }

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
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

        <WeatherCard date={today} />

        {/* Moisture card: only when a sensor has reported */}
        {reading && level && (
          <View style={styles.moistureWrap}>
            <SunsetPanel
              items={READINGS.map((r) => ({
                key: r.hour,
                hour: r.hour,
                icon: <DropIcon size={20} color={colors.white} />,
                value: `${r.percent}%`,
                label: `${r.hour}:00, ${r.percent}%`,
              }))}
              selected={Math.min(hour, READINGS.length - 1)}
              onSelect={setHour}
              date={today}
              big={`${reading.percent}%`}
              statusIcon={<DropIcon size={16} color="#F3D27A" />}
              statusText={t.moistureLabel[level]}
              footerIcon={<SproutIcon size={16} color={colors.white} />}
              footerText={`${t.soilMoisture} · POT-01`}
            />
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
          <View style={styles.headActions}>
            {isOwner && (
              <Pressable
                onPress={() => router.push('/add-zone')}
                accessibilityRole="button"
                accessibilityLabel={t.addZone}
                style={({ pressed }) => [styles.addZone, pressed && { opacity: 0.85 }]}
              >
                <PlusIcon size={16} color={colors.white} strokeWidth={2.2} />
                <Text style={styles.addZoneText}>{t.addZone}</Text>
              </Pressable>
            )}
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
        </View>

        <View style={styles.cards}>
          {shown.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.empty}>{zones.length === 0 ? t.noZonesYet : t.noZones}</Text>
              {zones.length === 0 && isOwner && (
                <>
                  <Text style={styles.emptyHint}>{t.noZonesHint}</Text>
                  <PrimaryButton label={t.addZone} onPress={() => router.push('/add-zone')} />
                </>
              )}
            </View>
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
  moistureWrap: { marginTop: 16 },
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
  headActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  addZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    backgroundColor: colors.green,
  },
  addZoneText: { fontFamily: fonts.medium, fontSize: 14, color: colors.white },
  emptyBox: { gap: 12, alignItems: 'stretch', paddingVertical: 10 },
  emptyHint: { textAlign: 'center', fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
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
