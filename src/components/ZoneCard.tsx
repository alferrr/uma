import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { hoursSince, toneFor, type Zone } from '@/lib/zones';
import { colors, fonts, statusColors } from '@/theme';
import { CropTile } from './art';
import { ArrowUpRight, DropIcon, PinIcon } from './icons';
import { StatusIcon } from './status';

/** Large photo-style card for one zone (Home · My Zones). */
export function ZoneCard({ zone, onPress }: { zone: Zone; onPress: () => void }) {
  const t = useT();
  const when = zone.lastCheckedAt ? t.hoursAgo(hoursSince(zone.lastCheckedAt)) : t.never;
  const statusWord =
    zone.status === 'dead' && zone.deadCount
      ? `${t.status.dead} · ${zone.deadCount}`
      : t.status[zone.status];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${zone.code}, ${statusWord}, ${t.lastChecked} ${when}`}
      style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.985 }] }]}
    >
      <CropTile tone={toneFor(zone.status)} style={StyleSheet.absoluteFill} />
      <View style={styles.shade} />

      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.badge}>
            <StatusIcon status={zone.status} color={statusColors[zone.status]} size={18} />
            <Text style={styles.badgeText}>{statusWord}</Text>
          </View>
          {zone.moisture && (
            <View style={styles.moisture}>
              <DropIcon size={18} color={zone.moisture === 'dry' ? colors.orange : '#F3D27A'} />
              <Text style={styles.moistureText}>{t.moisture[zone.moisture]}</Text>
            </View>
          )}
        </View>

        <View style={styles.bottom}>
          <View style={{ flex: 1 }}>
            <View style={styles.meta}>
              <PinIcon size={15} color="rgba(255,255,255,0.9)" />
              <Text style={styles.metaText} numberOfLines={1}>
                {zone.area} | {zone.row} · {when}
                {zone.lastCheckedBy ? ` · ${t.byName(zone.lastCheckedBy)}` : ''}
              </Text>
            </View>
            <Text style={styles.code}>{zone.code}</Text>
          </View>
          <View style={styles.go}>
            <ArrowUpRight size={22} color={colors.text} strokeWidth={2} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 280,
    borderRadius: 32,
    overflow: 'hidden',
  },
  // Padding lives here: absolute art inside a padded box comes up short.
  body: { flex: 1, padding: 18, justifyContent: 'space-between' },
  shade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(20,40,20,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: { fontFamily: fonts.medium, fontSize: 17, color: colors.white },
  moisture: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(20,40,20,0.45)',
  },
  moistureText: { fontFamily: fonts.regular, fontSize: 14, color: colors.white },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  code: { marginTop: 4, fontFamily: fonts.semibold, fontSize: 30, color: colors.white },
  go: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
