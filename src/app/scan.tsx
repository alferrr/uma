import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CropTile, FieldRows } from '@/components/art';
import { ArrowUpRight, ChevronLeft, ScanIcon } from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StatusTag } from '@/components/status';
import { findZone, setCurrentFarm, useUnsyncedCount, useZones } from '@/lib/db';
import { useT } from '@/lib/i18n';
import { parseZoneLink } from '@/lib/qr';
import { syncNow } from '@/lib/sync';
import { hoursSince, toneFor } from '@/lib/zones';
import { colors, fonts } from '@/theme';

/**
 * Screen 8 · Scan. Point the camera at a zone's QR code to open it. No NFC yet,
 * so the design's "Tap the tag" becomes "Scan the QR code". On the simulator
 * (no camera) use "Pick zone manually".
 */
export default function Scan() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const zones = useZones();
  const pending = useUnsyncedCount();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<string>();
  const [picking, setPicking] = useState(false);
  // The scanner fires many times a second; only act on the first good code.
  const busy = useRef(false);

  // Only one camera preview can run at a time: stop it whenever this screen is left.
  useFocusEffect(
    useCallback(() => {
      busy.current = false;
      return () => setScanning(false);
    }, []),
  );

  const last = zones
    .filter((z) => z.lastCheckedAt)
    .sort((a, b) => b.lastCheckedAt!.localeCompare(a.lastCheckedAt!))[0];

  function open(id: string) {
    const row = findZone(id);
    if (!row) return false;
    if (row.farm_id) setCurrentFarm(row.farm_id);
    setScanning(false);
    setPicking(false);
    router.push(`/zone/${id}`);
    return true;
  }

  async function onScanned({ data }: BarcodeScanningResult) {
    if (busy.current) return;
    const id = parseZoneLink(data);
    if (!id) {
      setMessage(t.notUmaQr);
      return;
    }
    busy.current = true;
    // A zone added on another phone may not be here yet: sync once and retry.
    if (!open(id)) {
      await syncNow();
      if (!open(id)) setMessage(t.zoneNotFound);
    }
    busy.current = false;
  }

  async function toggleScan() {
    setMessage(undefined);
    if (scanning) {
      setScanning(false);
      return;
    }
    let granted = permission?.granted ?? false;
    if (!granted && permission?.canAskAgain !== false)
      granted = (await requestPermission()).granted;
    if (granted) setScanning(true);
    else setMessage(t.cameraOff);
  }

  const blocked = permission && !permission.granted && !permission.canAskAgain;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <FieldRows style={styles.field} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <IconButton label={t.back} onPress={() => router.back()} variant="light">
            <ChevronLeft color={colors.text} />
          </IconButton>
          <View style={styles.syncPill}>
            <View style={[styles.dot, { backgroundColor: pending ? colors.orange : '#2FBF5B' }]} />
            <Text style={styles.syncText}>{pending ? t.notSynced(pending) : t.allSynced}</Text>
          </View>
        </View>

        <Text style={styles.title} accessibilityRole="header">
          {t.scanLead} <Text style={styles.strong}>{t.qrWord}</Text>
          {'\n'}
          {t.atThe} <Text style={styles.strong}>{t.zoneWord}</Text>
        </Text>
        <Text style={styles.body}>{t.scanBody}</Text>

        <View style={styles.window}>
          {scanning ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={onScanned}
            />
          ) : (
            <View style={styles.idle}>
              <View style={styles.idleIcon}>
                <ScanIcon size={34} color={colors.green} />
              </View>
            </View>
          )}
          {/* Corner marks, like the design's scan frame. */}
          <View pointerEvents="none" style={[styles.corner, styles.tl]} />
          <View pointerEvents="none" style={[styles.corner, styles.tr]} />
          <View pointerEvents="none" style={[styles.corner, styles.bl]} />
          <View pointerEvents="none" style={[styles.corner, styles.br]} />
        </View>

        {!!message && (
          <Text style={styles.message} accessibilityLiveRegion="polite">
            {message}
          </Text>
        )}
        {scanning && <Text style={styles.hint}>{t.noCameraHint}</Text>}
        {blocked && (
          <Pressable onPress={() => Linking.openSettings()} accessibilityRole="button">
            <Text style={styles.link}>{t.openSettings}</Text>
          </Pressable>
        )}

        <View style={styles.bottom}>
          {last && (
            <Pressable
              onPress={() => open(last.id)}
              accessibilityRole="button"
              accessibilityLabel={`${t.lastChecked}: ${last.code}`}
              style={({ pressed }) => [styles.lastCard, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.lastThumb}>
                <CropTile tone={toneFor(last.status)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lastLabel}>{t.lastChecked}</Text>
                <Text style={styles.lastValue} numberOfLines={1}>
                  {last.code} · {t.hoursAgo(hoursSince(last.lastCheckedAt!))}
                </Text>
              </View>
              <ArrowUpRight size={20} color={colors.white} />
            </Pressable>
          )}

          <PrimaryButton label={scanning ? t.stopScan : t.scanQr} onPress={toggleScan} />
          <Pressable
            onPress={() => setPicking(true)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.manual, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.manualText}>{t.pickManually}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={picking}
        transparent
        animationType="slide"
        onRequestClose={() => setPicking(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setPicking(false)} accessible={false} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle} accessibilityRole="header">
            {t.pickZoneTitle}
          </Text>
          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 10 }}>
            {zones.length === 0 && <Text style={styles.empty}>{t.noZonesYet}</Text>}
            {zones.map((z) => (
              <Pressable
                key={z.id}
                onPress={() => open(z.id)}
                accessibilityRole="button"
                accessibilityLabel={`${z.code}, ${t.status[z.status]}`}
                style={({ pressed }) => [styles.pickRow, pressed && { opacity: 0.85 }]}
              >
                <CropTile tone={toneFor(z.status)} style={StyleSheet.absoluteFill} />
                <View style={styles.pickBody}>
                  <StatusTag code={z.code} status={z.status} deadCount={z.deadCount} />
                  <Text style={styles.pickMeta} numberOfLines={1}>
                    {z.area} {z.row ? `| ${z.row}` : ''}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
          <PrimaryButton label={t.cancel} onPress={() => setPicking(false)} />
        </View>
      </Modal>
    </View>
  );
}

const CORNER = 34;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  field: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%' },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  dot: { width: 9, height: 9, borderRadius: 5 },
  syncText: { fontFamily: fonts.regular, fontSize: 14, color: colors.text },
  title: {
    marginTop: 26,
    fontFamily: fonts.regular,
    fontSize: 38,
    lineHeight: 46,
    color: colors.text,
    letterSpacing: -0.6,
  },
  strong: { fontFamily: fonts.bold, color: colors.green },
  body: {
    marginTop: 12,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: '#3B3B38',
  },
  window: {
    marginTop: 30,
    alignSelf: 'center',
    width: 250,
    height: 250,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  idle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  idleIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.white },
  tl: { top: 40, left: 40, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10 },
  tr: { top: 40, right: 40, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10 },
  bl: {
    bottom: 40,
    left: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  br: {
    bottom: 40,
    right: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  message: {
    marginTop: 14,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.danger,
  },
  hint: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  link: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.green,
    textDecorationLine: 'underline',
  },
  bottom: { marginTop: 'auto', paddingTop: 28, gap: 12 },
  lastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    paddingRight: 18,
    borderRadius: 34,
    backgroundColor: 'rgba(12,50,24,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  lastThumb: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden' },
  lastLabel: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  lastValue: { fontFamily: fonts.medium, fontSize: 17, color: colors.white },
  manual: {
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  manualText: { fontFamily: fonts.medium, fontSize: 17, color: colors.green },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 14,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D6D6D0',
  },
  sheetTitle: { fontFamily: fonts.medium, fontSize: 22, color: colors.text },
  pickRow: { height: 92, borderRadius: 22, overflow: 'hidden' },
  pickBody: { flex: 1, padding: 12, justifyContent: 'space-between' },
  pickMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.white },
  empty: { textAlign: 'center', fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
});
