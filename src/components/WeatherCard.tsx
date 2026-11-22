import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { adviceFor, useWeather, type Condition, type Weather } from '@/lib/weather';
import { colors, fonts } from '@/theme';
import {
  CheckIcon,
  CloudIcon,
  DropIcon,
  FogIcon,
  MoonIcon,
  PartlyCloudyIcon,
  RainIcon,
  StormIcon,
  SunIcon,
  UmbrellaIcon,
  WindIcon,
} from './icons';

function ConditionIcon({ w, size }: { w: Weather; size: number }) {
  const props = { size, color: colors.green, strokeWidth: 1.8 };
  const byCondition: Record<Condition, () => React.JSX.Element> = {
    clear: () => (w.isDay ? <SunIcon {...props} /> : <MoonIcon {...props} />),
    partly: () => <PartlyCloudyIcon {...props} />,
    cloudy: () => <CloudIcon {...props} />,
    fog: () => <FogIcon {...props} />,
    drizzle: () => <RainIcon {...props} />,
    rain: () => <RainIcon {...props} />,
    storm: () => <StormIcon {...props} />,
  };
  return byCondition[w.condition]();
}

const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

/** Live weather for the farm, with a plain-language note on watering. */
export function WeatherCard() {
  const t = useT();
  const { weather: w, loading, stale, refresh } = useWeather();

  if (!w) {
    return (
      <View style={[styles.card, styles.empty]}>
        {loading ? (
          <ActivityIndicator color={colors.green} />
        ) : (
          <>
            <Text style={styles.unavailable}>{t.weatherUnavailable}</Text>
            <Pressable
              onPress={refresh}
              accessibilityRole="button"
              style={({ pressed }) => [styles.retry, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.retryText}>{t.tryAgain}</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  const advice = adviceFor(w);
  const temp = Math.round(w.tempC);
  const label = `${t.weather}, ${t.weatherPlace}, ${temp}°, ${t.conditions[w.condition]}`;

  return (
    <View style={styles.card} accessible accessibilityLabel={label}>
      <View style={styles.top}>
        <View style={styles.iconWrap}>
          <ConditionIcon w={w} size={34} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.temp}>{temp}°C</Text>
          <Text style={styles.cond} numberOfLines={1}>
            {t.conditions[w.condition]} · {t.weatherPlace}
          </Text>
        </View>
        <Text style={styles.highLow}>{t.highLow(Math.round(w.highC), Math.round(w.lowC))}</Text>
      </View>

      <View style={styles.stats}>
        <Stat
          icon={<DropIcon size={16} color={colors.green} />}
          label={t.humidity}
          value={`${Math.round(w.humidity)}%`}
        />
        <Stat
          icon={<WindIcon size={16} color={colors.green} />}
          label={t.wind}
          value={`${Math.round(w.windKmh)} km/h`}
        />
        <Stat
          icon={<UmbrellaIcon size={16} color={colors.green} />}
          label={t.rainToday}
          value={`${w.rainChance}%`}
        />
      </View>

      <View style={styles.advice}>
        {advice === 'rain' ? (
          <UmbrellaIcon size={18} color={colors.green} />
        ) : advice === 'hot' ? (
          <SunIcon size={18} color={colors.orange} />
        ) : (
          <CheckIcon size={18} color={colors.green} />
        )}
        <Text style={styles.adviceText}>{t.advice[advice]}</Text>
      </View>

      <Text style={[styles.updated, stale && styles.stale]}>
        {stale ? t.offlineAt(clock(w.fetchedAt)) : t.updatedAt(clock(w.fetchedAt))}
      </Text>
    </View>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.stat}>
      {icon}
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: -78,
    marginHorizontal: 18,
    padding: 18,
    borderRadius: 32,
    backgroundColor: colors.surface,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  empty: { minHeight: 120, alignItems: 'center', justifyContent: 'center' },
  unavailable: { fontFamily: fonts.regular, fontSize: 16, color: colors.muted },
  retry: {
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.green,
    justifyContent: 'center',
  },
  retryText: { fontFamily: fonts.medium, fontSize: 15, color: colors.white },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  temp: { fontFamily: fonts.semibold, fontSize: 38, lineHeight: 44, color: colors.text },
  cond: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
  highLow: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'right',
  },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statValue: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  statLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  advice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.bg,
  },
  adviceText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  updated: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: -4 },
  stale: { color: colors.orange },
});
