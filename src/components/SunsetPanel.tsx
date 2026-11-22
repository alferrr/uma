import { useId, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors, fonts } from '@/theme';
import { SunsetField } from './art';
import { WifiIcon } from './icons';

export type HourItem = {
  key: string;
  /** Two-digit hour, like "09". */
  hour: string;
  icon: ReactNode;
  value: string;
  label: string;
};

type Props = {
  items: HourItem[];
  selected: number;
  onSelect: (index: number) => void;
  date: string;
  big: string;
  /** Right of the big number: small icon + status word. */
  statusIcon: ReactNode;
  statusText: string;
  /** Optional second line under the status. */
  statusSub?: string;
  footerIcon: ReactNode;
  footerText: string;
  footerRight?: ReactNode;
  accessibilityLabel?: string;
};

/** Dark sunset card with an hour strip, a big reading and a footer, from the Uma dashboard. */
export function SunsetPanel(p: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <View style={styles.card}>
      <SunsetField style={StyleSheet.absoluteFill} />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
        <Defs>
          <LinearGradient id={`top${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1B160D" stopOpacity={0.88} />
            <Stop offset="0.45" stopColor="#3A2A12" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#4A3414" stopOpacity={0.45} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${`top${id}`})`} />
      </Svg>

      <View style={styles.body}>
        <View style={styles.hours} accessibilityRole="tablist">
          {p.items.map((it, i) => {
            const on = i === p.selected;
            return (
              <Pressable
                key={it.key}
                onPress={() => p.onSelect(i)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={it.label}
                style={[styles.pill, on && styles.pillOn]}
              >
                <Text style={styles.hourText}>{it.hour}</Text>
                {it.icon}
                <Text style={styles.pillValue}>{it.value}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.date}>{p.date}</Text>
        <View style={styles.readingRow} accessible accessibilityLabel={p.accessibilityLabel}>
          <Text style={styles.big}>{p.big}</Text>
          <View style={styles.status}>
            <View style={styles.statusRow}>
              {p.statusIcon}
              <Text style={styles.statusText}>{p.statusText}</Text>
            </View>
            {!!p.statusSub && <Text style={styles.statusSub}>{p.statusSub}</Text>}
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            {p.footerIcon}
            <Text style={styles.footerText} numberOfLines={1}>
              {p.footerText}
            </Text>
          </View>
          {p.footerRight}
        </View>
      </View>
    </View>
  );
}

/** Frosted pill with a green wifi dot, like "Sensor · 10:40 AM" in the design. */
export function LivePill({ text, offline }: { text: string; offline?: boolean }) {
  return (
    <View style={styles.live}>
      <View style={[styles.liveDot, offline && { backgroundColor: colors.orange }]}>
        <WifiIcon size={14} color={colors.white} />
      </View>
      <Text style={styles.liveText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 18, borderRadius: 32, overflow: 'hidden' },
  body: { padding: 16 },
  hours: { flexDirection: 'row', gap: 6 },
  pill: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  pillOn: { backgroundColor: colors.orange, borderColor: colors.orange },
  hourText: { fontFamily: fonts.regular, fontSize: 14, color: colors.white },
  pillValue: { fontFamily: fonts.semibold, fontSize: 16, color: colors.white },
  date: { marginTop: 22, fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  readingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  big: { fontFamily: fonts.medium, fontSize: 52, lineHeight: 62, color: colors.white },
  status: { alignItems: 'flex-end', maxWidth: '55%' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontFamily: fonts.regular, fontSize: 15, color: colors.white },
  statusSub: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  footer: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  footerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.white },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 5,
    paddingRight: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  liveDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2FBF5B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveText: { fontFamily: fonts.regular, fontSize: 14, color: colors.white },
});
