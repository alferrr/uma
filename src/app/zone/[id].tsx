import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CropTile, GreenStripes, ZoneAerial } from '@/components/art';
import { ChevronLeft, DropIcon, TrashIcon } from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StatusIcon } from '@/components/status';
import { useCurrentFarm, useZone } from '@/lib/db';
import { canManageFarm, removeZone } from '@/lib/farms';
import { useT } from '@/lib/i18n';
import { toneFor } from '@/lib/zones';
import { colors, fonts, statusColors } from '@/theme';

/** Screen 7 · Zone details */
export default function ZoneDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const zone = useZone(id);
  const farm = useCurrentFarm();
  const canDelete = canManageFarm(farm);
  const insets = useSafeAreaInsets();
  const t = useT();

  if (!zone) {
    return (
      <View style={[styles.missing, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.missingText}>{t.noZones}</Text>
        <PrimaryButton label={t.backNow} onPress={() => router.back()} />
      </View>
    );
  }

  function confirmDelete() {
    if (!zone) return;
    Alert.alert(t.deleteZoneTitle(zone.code), t.deleteZoneBody, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.deleteWord,
        style: 'destructive',
        onPress: async () => {
          const error = await removeZone(zone.id);
          if (error) Alert.alert(error === 'forbidden' ? t.ownersOnly : t.deleteFailed);
          else router.back();
        },
      },
    ]);
  }

  const last = zone.lastCheckedAt
    ? new Date(zone.lastCheckedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;
  const statusLine =
    zone.status === 'not_checked'
      ? t.status.not_checked
      : `${t.status[zone.status]} · ${zone.deadCount} ${t.dead}`;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ZoneAerial style={StyleSheet.absoluteFill} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <IconButton label="Back" onPress={() => router.back()}>
          <ChevronLeft />
        </IconButton>
        <View style={styles.pill}>
          <View style={styles.pillThumb}>
            <GreenStripes />
          </View>
          <View>
            <Text style={styles.pillTitle}>{zone.code}</Text>
            <Text style={styles.pillSub}>
              {zone.area} · {zone.row}
            </Text>
          </View>
        </View>
      </View>

      {/* Location marker */}
      <View style={styles.marker} accessible={false}>
        <View style={styles.markerDot} />
      </View>

      <View style={[styles.sheet, { marginBottom: insets.bottom + 12 }]}>
        <View style={styles.head}>
          <View style={styles.thumb}>
            <GreenStripes />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.code} accessibilityRole="header">
              {zone.code}
            </Text>
            <Text style={styles.last}>{last ? `${t.lastChecked}: ${last}` : t.never}</Text>
          </View>
          {zone.moisture && (
            <View style={styles.moisture}>
              <DropIcon size={18} color={colors.green} />
              <Text style={styles.moistureText}>{t.moisture[zone.moisture]}</Text>
            </View>
          )}
        </View>

        <View style={styles.inner}>
          <CropTile tone={toneFor(zone.status)} style={StyleSheet.absoluteFill} />
          <View style={styles.innerBody}>
            <View style={styles.badge}>
              <StatusIcon status={zone.status} color={statusColors[zone.status]} size={17} />
              <Text style={styles.badgeText}>{statusLine}</Text>
            </View>
            <PrimaryButton label={t.checkIn} onPress={() => router.push(`/check-in/${zone.id}`)} />
          </View>
        </View>
        {canDelete && (
          <Pressable
            onPress={confirmDelete}
            accessibilityRole="button"
            accessibilityLabel={`${t.deleteZone}: ${zone.code}`}
            style={({ pressed }) => [styles.delete, pressed && { opacity: 0.6 }]}
          >
            <TrashIcon size={18} color={colors.danger} />
            <Text style={styles.deleteText}>{t.deleteZone}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
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
  marker: {
    position: 'absolute',
    top: '48%',
    alignSelf: 'center',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.green,
    borderWidth: 4,
    borderColor: colors.white,
  },
  sheet: {
    marginHorizontal: 14,
    padding: 18,
    borderRadius: 32,
    backgroundColor: colors.surface,
    gap: 16,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  thumb: { width: 60, height: 60, borderRadius: 30, overflow: 'hidden' },
  code: { fontFamily: fonts.medium, fontSize: 26, color: colors.text },
  last: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  moisture: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moistureText: { fontFamily: fonts.regular, fontSize: 16, color: colors.text },
  inner: {
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
  },
  innerBody: { flex: 1, padding: 14, justifyContent: 'space-between' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(20,40,20,0.5)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: { fontFamily: fonts.regular, fontSize: 15, color: colors.white },
  delete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
  },
  deleteText: { fontFamily: fonts.medium, fontSize: 15, color: colors.danger },
  missing: { flex: 1, padding: 24, gap: 20, backgroundColor: colors.bg },
  missingText: { fontFamily: fonts.regular, fontSize: 17, color: colors.text },
});
