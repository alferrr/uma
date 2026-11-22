import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { useWeather, type Condition } from '@/lib/weather';
import { colors, fonts } from '@/theme';
import {
  CloudIcon,
  FogIcon,
  MoonIcon,
  PartlyCloudyIcon,
  PinIcon,
  RainIcon,
  StormIcon,
  SunIcon,
} from './icons';
import { LivePill, SunsetPanel } from './SunsetPanel';

function ConditionIcon({
  condition,
  isDay,
  size,
  color = colors.white,
}: {
  condition: Condition;
  isDay: boolean;
  size: number;
  color?: string;
}) {
  const p = { size, color, strokeWidth: 1.8 };
  switch (condition) {
    case 'clear':
      return isDay ? <SunIcon {...p} /> : <MoonIcon {...p} />;
    case 'partly':
      return <PartlyCloudyIcon {...p} />;
    case 'fog':
      return <FogIcon {...p} />;
    case 'drizzle':
    case 'rain':
      return <RainIcon {...p} />;
    case 'storm':
      return <StormIcon {...p} />;
    default:
      return <CloudIcon {...p} />;
  }
}

const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

/** Weather for the farm, in the dashboard's sunset card: hours, big temperature, status. */
export function WeatherCard({ date }: { date: string }) {
  const t = useT();
  const { weather: w, loading, stale, refresh } = useWeather();
  const [picked, setPicked] = useState(0);

  if (!w) {
    return (
      <View style={[styles.wrap, styles.empty]}>
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

  const index = Math.min(picked, w.hours.length - 1);
  const h = w.hours[index]!;
  const temp = (c: number) => `${Math.round(c)}°`;

  return (
    <View style={styles.wrap}>
      <SunsetPanel
        items={w.hours.map((x) => ({
          key: x.hour,
          hour: x.hour,
          icon: <ConditionIcon condition={x.condition} isDay={x.isDay} size={20} />,
          value: temp(x.tempC),
          label: `${x.hour}:00, ${temp(x.tempC)}, ${t.conditions[x.condition]}`,
        }))}
        selected={index}
        onSelect={setPicked}
        date={date}
        big={temp(h.tempC)}
        statusIcon={
          <ConditionIcon condition={h.condition} isDay={h.isDay} size={18} color="#F3D27A" />
        }
        statusText={t.conditions[h.condition]}
        statusSub={`${t.rainToday} ${w.rainChance}%`}
        footerIcon={<PinIcon size={16} color={colors.white} />}
        footerText={`${t.weather} · ${t.weatherPlace}`}
        footerRight={
          <LivePill
            offline={stale}
            text={`${stale ? t.offline : t.live} · ${clock(w.fetchedAt)}`}
          />
        }
        accessibilityLabel={`${t.weather}, ${t.weatherPlace}, ${temp(h.tempC)}, ${t.conditions[h.condition]}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: -78 },
  empty: {
    marginHorizontal: 18,
    padding: 18,
    minHeight: 120,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  unavailable: { fontFamily: fonts.regular, fontSize: 16, color: colors.muted },
  retry: {
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.green,
    justifyContent: 'center',
  },
  retryText: { fontFamily: fonts.medium, fontSize: 15, color: colors.white },
});
