import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { GreenStripes } from '@/components/art';
import { AuthLayout } from '@/components/AuthLayout';
import { CheckIcon, ChevronLeft, PinIcon, TrashIcon } from '@/components/icons';
import { PrimaryButton } from '@/components/PrimaryButton';
import { getUser } from '@/lib/auth';
import { setCurrentFarm, useCurrentFarm, useFarms, useZoneCounts, type FarmRow } from '@/lib/db';
import { canManageFarm, removeFarm } from '@/lib/farms';
import { useT } from '@/lib/i18n';
import { colors, fonts } from '@/theme';

/** Farms. Pick the one to work in, add a farm, or delete one you own. */
export default function Farms() {
  const t = useT();
  const farms = useFarms();
  const current = useCurrentFarm();
  const counts = useZoneCounts();
  const isOwner = getUser()?.role === 'owner';

  function confirmDelete(farm: FarmRow) {
    Alert.alert(t.deleteFarmTitle(farm.name), t.deleteFarmBody, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.deleteWord,
        style: 'destructive',
        onPress: async () => {
          const error = await removeFarm(farm.id);
          if (error) Alert.alert(error === 'forbidden' ? t.ownersOnlyFarm : t.deleteFailed);
        },
      },
    ]);
  }

  return (
    <AuthLayout
      heroRatio={0.27}
      art={<GreenStripes />}
      hero={
        <>
          <StatusBar style="light" />
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={t.back}
            hitSlop={8}
          >
            <ChevronLeft />
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            <Text style={styles.titleStrong}>{t.farmsTitle}</Text>
          </Text>
        </>
      }
    >
      {farms.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.empty}>{t.noFarmsYet}</Text>
          <Text style={styles.hint}>{t.noFarmsHint}</Text>
        </View>
      ) : (
        <View style={styles.list} accessibilityRole="radiogroup">
          {farms.map((f) => {
            const on = f.id === current?.id;
            return (
              <View key={f.id} style={[styles.row, on && styles.rowOn]}>
                <Pressable
                  onPress={() => {
                    setCurrentFarm(f.id);
                    router.back();
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on, selected: on }}
                  accessibilityLabel={`${f.name}, ${t.zoneCount(counts.get(f.id) ?? 0)}`}
                  style={styles.main}
                >
                  <View style={[styles.badge, on && styles.badgeOn]}>
                    <PinIcon size={22} color={on ? colors.white : colors.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {f.name}
                    </Text>
                    <Text style={styles.sub}>
                      {t.zoneCount(counts.get(f.id) ?? 0)}
                      {on ? ` · ${t.currentFarm}` : ''}
                    </Text>
                  </View>
                  {on && <CheckIcon size={20} color={colors.green} strokeWidth={2.4} />}
                </Pressable>
                {canManageFarm(f) && (
                  <Pressable
                    onPress={() => confirmDelete(f)}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.deleteFarm}: ${f.name}`}
                    hitSlop={8}
                    style={({ pressed }) => [styles.trash, pressed && { opacity: 0.6 }]}
                  >
                    <TrashIcon size={20} color={colors.danger} />
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      )}

      {isOwner && (
        <View style={styles.cta}>
          <PrimaryButton label={t.addFarm} onPress={() => router.push('/add-farm')} />
        </View>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  back: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  title: { fontFamily: fonts.light, fontSize: 36, lineHeight: 42, color: colors.white },
  titleStrong: { fontFamily: fonts.bold },
  list: { gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  rowOn: { borderColor: colors.green, backgroundColor: colors.white },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12 },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EAF5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOn: { backgroundColor: colors.green },
  name: { fontFamily: fonts.medium, fontSize: 18, color: colors.text },
  sub: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  trash: { padding: 18 },
  emptyBox: { alignItems: 'center', gap: 6, paddingVertical: 24 },
  empty: { fontFamily: fonts.medium, fontSize: 18, color: colors.text },
  hint: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center' },
  cta: { marginTop: 22 },
});
