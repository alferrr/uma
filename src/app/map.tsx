import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CropTile, GreenStripes, SunsetField } from '@/components/art';
import { ArrowUpRight, ChevronLeft, ZoomInIcon, ZoomOutIcon } from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { StatusTag } from '@/components/status';
import { useCurrentFarm, useZones } from '@/lib/db';
import { useT } from '@/lib/i18n';
import { byAttention, needsVisit, toneFor, type Status } from '@/lib/zones';
import { colors, fonts, statusColors } from '@/theme';

const COUNT_ORDER: Status[] = ['ok', 'needs_water', 'dead', 'not_checked'];
const ZOOMS = [1, 1.5, 2];
const PLOT_HEIGHT = 210;

/** Screen 6 · Map */
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const t = useT();
  const zones = useZones();
  const farm = useCurrentFarm();
  const { width } = useWindowDimensions();
  const [zoomStep, setZoomStep] = useState(0);
  const zoom = ZOOMS[zoomStep]!;

  const visit = zones.filter(needsVisit).sort(byAttention);
  const counts = COUNT_ORDER.map((s) => ({ s, n: zones.filter((z) => z.status === s).length }));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={{ paddingTop: insets.top + 96, paddingBottom: 260 }}
        showsVerticalScrollIndicator={false}
      >
        {zones.length === 0 && <Text style={styles.empty}>{t.noZonesYet}</Text>}
        {/* Zooming makes the plots bigger; scroll sideways to see the rest. */}
        <ScrollView
          horizontal
          scrollEnabled={zoom > 1}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.farm}
        >
          <View style={[styles.grid, { width: (width - 28) * zoom }]}>
            {zones.map((z) => (
              <Pressable
                key={z.id}
                onPress={() => router.push(`/zone/${z.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`${z.code}, ${t.status[z.status]}`}
                style={({ pressed }) => [
                  styles.plot,
                  { height: PLOT_HEIGHT * zoom },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <CropTile tone={toneFor(z.status)} style={StyleSheet.absoluteFill} />
                <View style={styles.plotBody}>
                  <StatusTag code={z.code} status={z.status} deadCount={z.deadCount} />
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      {zones.length > 0 && (
        <View style={[styles.zoom, { top: insets.top + 84 }]}>
          <IconButton
            label={t.zoomIn}
            onPress={() => setZoomStep((n) => Math.min(n + 1, ZOOMS.length - 1))}
            size={52}
          >
            <ZoomInIcon
              size={22}
              color={zoomStep < ZOOMS.length - 1 ? colors.white : 'rgba(255,255,255,0.4)'}
            />
          </IconButton>
          <IconButton
            label={t.zoomOut}
            onPress={() => setZoomStep((n) => Math.max(n - 1, 0))}
            size={52}
          >
            <ZoomOutIcon size={22} color={zoomStep > 0 ? colors.white : 'rgba(255,255,255,0.4)'} />
          </IconButton>
        </View>
      )}

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <IconButton label="Back" onPress={() => router.back()}>
          <ChevronLeft />
        </IconButton>
        <View style={styles.farmPill}>
          <View style={styles.farmThumb}>
            <GreenStripes />
          </View>
          <View>
            <Text style={styles.farmName}>{farm?.name ?? t.farmsTitle}</Text>
            <Text style={styles.farmSub}>{t.zoneCount(zones.length)}</Text>
          </View>
        </View>
      </View>

      {/* Summary */}
      <View style={[styles.summary, { marginBottom: insets.bottom + 12 }]}>
        <View style={styles.summaryTop}>
          <View style={styles.summaryThumb}>
            <SunsetField />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>{t.zonesNeedVisit(visit.length)}</Text>
            <Text style={styles.summarySub}>{t.needVisitToday}</Text>
          </View>
          {visit[0] && (
            <Pressable
              onPress={() => router.push(`/zone/${visit[0]!.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${visit[0].code}`}
              style={({ pressed }) => [styles.go, pressed && { opacity: 0.85 }]}
            >
              <ArrowUpRight size={22} color={colors.white} strokeWidth={2} />
            </Pressable>
          )}
        </View>
        <View style={styles.divider} />
        <View style={styles.counts}>
          {counts.map(({ s, n }) => (
            <View
              key={s}
              style={styles.count}
              accessible
              accessibilityLabel={`${n} ${t.statusShort[s]}`}
            >
              <View style={styles.countRow}>
                <View style={[styles.dot, { backgroundColor: statusColors[s] }]} />
                <Text style={styles.countN}>{n}</Text>
              </View>
              <Text style={styles.countLabel}>{t.statusShort[s]}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#5E5A45', justifyContent: 'flex-end' },
  farm: { paddingHorizontal: 14 },
  empty: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.white,
    paddingVertical: 40,
  },
  zoom: { position: 'absolute', right: 22, gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  plot: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  plotBody: { flex: 1, padding: 12, justifyContent: 'center', alignItems: 'flex-start' },
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
  farmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 6,
    paddingRight: 20,
    borderRadius: 34,
    backgroundColor: 'rgba(20,40,20,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  farmThumb: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden' },
  farmName: { fontFamily: fonts.semibold, fontSize: 18, color: colors.white },
  farmSub: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  summary: {
    marginHorizontal: 14,
    padding: 18,
    borderRadius: 32,
    backgroundColor: colors.surface,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  summaryThumb: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden' },
  summaryTitle: { fontFamily: fonts.medium, fontSize: 22, color: colors.text },
  summarySub: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  go: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E2E2DD', marginVertical: 14 },
  counts: { flexDirection: 'row', justifyContent: 'space-between' },
  count: { gap: 2 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  countN: { fontFamily: fonts.medium, fontSize: 26, color: colors.text },
  countLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
});
