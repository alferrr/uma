import { useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GreenStripes } from '@/components/art';
import { BackHero } from '@/components/BackHero';
import { ClockIcon, DropIcon } from '@/components/icons';
import { StatusIcon } from '@/components/status';
import { useHistory } from '@/lib/db';
import { useT } from '@/lib/i18n';
import { useZoneById } from '@/lib/useZoneById';
import { colors, fonts, statusColors } from '@/theme';

const when = (iso: string) =>
  new Date(iso).toLocaleString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

/** Every check-in for one zone, newest first, with who checked. */
export default function History() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const zone = useZoneById(id);
  const rows = useHistory(id);

  return (
    <View style={styles.root}>
      <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <GreenStripes style={StyleSheet.absoluteFill} />
        <View style={styles.heroBody}>
          <BackHero lead={zone?.code} strong={t.history} />
        </View>
      </View>
      <FlatList
        style={styles.sheet}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        data={rows}
        keyExtractor={(c) => c.id}
        ListEmptyComponent={<Text style={styles.empty}>{t.noHistory}</Text>}
        renderItem={({ item: c }) => (
          <View style={styles.row}>
            <View style={styles.icon}>
              <StatusIcon status={c.status} color={statusColors[c.status]} size={20} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.status}>
                {t.status[c.status]}
                {c.status === 'dead' ? ` · ${c.dead_count}` : ''}
              </Text>
              <View style={styles.meta}>
                <DropIcon size={13} color={colors.muted} />
                <Text style={styles.metaText}>{t.moisture[c.moisture]}</Text>
                <ClockIcon size={13} color={colors.muted} />
                <Text style={styles.metaText}>{when(c.checked_at)}</Text>
              </View>
              {!!c.worker_name && <Text style={styles.by}>{t.byName(c.worker_name)}</Text>}
            </View>
            {!c.synced_at && (
              <View style={styles.pending}>
                <Text style={styles.pendingText}>{t.notSyncedShort}</Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  hero: { height: 240, overflow: 'hidden' },
  heroBody: { flex: 1, paddingHorizontal: 30, paddingBottom: 56, justifyContent: 'space-between' },
  sheet: {
    flex: 1,
    marginTop: -32,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  list: { padding: 20, paddingTop: 28, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 22,
    backgroundColor: colors.bg,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginRight: 6 },
  by: { fontFamily: fonts.regular, fontSize: 13, color: colors.green },
  pending: {
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FDEBD3',
    justifyContent: 'center',
  },
  pendingText: { fontFamily: fonts.medium, fontSize: 12, color: '#B45309' },
  empty: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.muted,
    paddingVertical: 30,
  },
});
