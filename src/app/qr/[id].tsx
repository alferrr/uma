import * as Print from 'expo-print';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GreenStripes } from '@/components/art';
import { AuthLayout } from '@/components/AuthLayout';
import { BackHero } from '@/components/BackHero';
import { PrinterIcon } from '@/components/icons';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QrCode } from '@/components/QrCode';
import { useCurrentFarm, useZones } from '@/lib/db';
import { useT } from '@/lib/i18n';
import { useZoneById } from '@/lib/useZoneById';
import { qrSvg, zoneLink } from '@/lib/qr';
import type { Zone } from '@/lib/zones';
import { colors, fonts } from '@/theme';

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** One printable label: big QR, zone code, farm, area and row. */
function label(zone: Zone, farmName: string, scanWithUma: string) {
  const place = [zone.area, zone.row].filter(Boolean).map(escape).join(' | ');
  return `
    <div class="label">
      ${qrSvg(zoneLink(zone.id), 260)}
      <div class="code">${escape(zone.code)}</div>
      <div class="farm">${escape(farmName)}</div>
      ${place ? `<div class="place">${place}</div>` : ''}
      <div class="scan">${escape(scanWithUma)}</div>
    </div>`;
}

function page(labels: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; margin: 0; }
    .sheet { display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; padding: 24px; }
    .label { width: 300px; padding: 16px; border: 2px dashed #999; border-radius: 12px;
             text-align: center; page-break-inside: avoid; }
    .code { font-size: 34px; font-weight: 700; margin-top: 8px; letter-spacing: 1px; }
    .farm { font-size: 16px; color: #333; margin-top: 4px; }
    .place { font-size: 14px; color: #555; margin-top: 2px; }
    .scan { font-size: 12px; color: #16923F; margin-top: 8px; }
  </style></head><body><div class="sheet">${labels}</div></body></html>`;
}

/** A zone's QR code, to print and attach to its stake. Scanning it opens the zone. */
export default function ZoneQr() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const zone = useZoneById(id);
  const zones = useZones();
  const farm = useCurrentFarm();
  const [busy, setBusy] = useState(false);

  if (!zone) {
    return (
      <AuthLayout heroRatio={0.24} art={<GreenStripes />} hero={<BackHero strong={t.qrCode} />}>
        <Text style={styles.hint}>{t.zoneNotFound}</Text>
      </AuthLayout>
    );
  }
  const farmName = farm?.name ?? '';

  async function print(list: Zone[]) {
    setBusy(true);
    try {
      await Print.printAsync({
        html: page(list.map((z) => label(z, farmName, t.scanWithUma)).join('')),
      });
    } catch {
      // iOS rejects when the print sheet is closed without printing; nothing to report.
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      heroRatio={0.24}
      art={<GreenStripes />}
      hero={<BackHero lead={zone.code} strong={t.qrCode} />}
    >
      <View style={styles.card} accessible accessibilityLabel={`${t.qrCode}: ${zone.code}`}>
        <QrCode value={zoneLink(zone.id)} size={230} />
        <Text style={styles.code}>{zone.code}</Text>
        <Text style={styles.farm}>
          {farmName}
          {zone.area ? ` · ${zone.area}` : ''}
          {zone.row ? ` | ${zone.row}` : ''}
        </Text>
      </View>
      <Text style={styles.hint}>{t.qrHint}</Text>

      <View style={styles.cta}>
        <PrimaryButton label={t.printQr} onPress={() => print([zone])} loading={busy} />
      </View>
      {zones.length > 1 && (
        <Pressable
          onPress={() => print(zones)}
          disabled={busy}
          accessibilityRole="button"
          style={({ pressed }) => [styles.all, pressed && { opacity: 0.7 }]}
        >
          <PrinterIcon size={20} color={colors.green} />
          <Text style={styles.allText}>
            {t.printAll} ({zones.length})
          </Text>
        </Pressable>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    padding: 18,
    borderRadius: 28,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: '#E4E4DE',
    borderStyle: 'dashed',
  },
  code: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 30,
    letterSpacing: 1,
    color: colors.text,
  },
  farm: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, textAlign: 'center' },
  hint: {
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    textAlign: 'center',
  },
  cta: { marginTop: 20 },
  all: {
    marginTop: 12,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.green,
  },
  allText: { fontFamily: fonts.medium, fontSize: 16, color: colors.green },
});
