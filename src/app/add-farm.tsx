import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GreenStripes } from '@/components/art';
import { AuthLayout } from '@/components/AuthLayout';
import { ChevronLeft } from '@/components/icons';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { getUser } from '@/lib/auth';
import { useFarm } from '@/lib/db';
import { canManageFarm, createFarm, renameFarm } from '@/lib/farms';
import { useT } from '@/lib/i18n';
import { colors, fonts } from '@/theme';

/** Add a farm (owners only), or rename one you own with `?id=`. A farm holds zones. */
export default function AddFarm() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = useFarm(id);
  const [name, setName] = useState(editing?.name ?? '');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const canSave = editing ? canManageFarm(editing) : getUser()?.role === 'owner';

  async function submit() {
    if (!name.trim()) {
      setError(t.farmNameRequired);
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      const res = editing ? await renameFarm(editing, name) : await createFarm(name);
      if (res.error) setError(res.error === 'forbidden' ? t.ownersOnlyFarm : t.farmSaveFailed);
      else router.back();
    } catch {
      setError(t.farmSaveFailed);
    } finally {
      setLoading(false);
    }
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
            {editing ? t.editA : t.addA}
            {'\n'}
            <Text style={styles.titleStrong}>{t.farmWord}</Text>
          </Text>
        </>
      }
    >
      <TextField
        placeholder={t.farmName}
        value={name}
        onChangeText={setName}
        error={error}
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      {!canSave && <Text style={styles.note}>{t.ownersOnlyFarm}</Text>}
      <View style={styles.cta}>
        <PrimaryButton label={t.saveFarm} onPress={submit} loading={loading} disabled={!canSave} />
      </View>
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
  title: {
    fontFamily: fonts.light,
    fontSize: 36,
    lineHeight: 42,
    color: colors.white,
    letterSpacing: -0.5,
  },
  titleStrong: { fontFamily: fonts.bold },
  note: { marginTop: 14, fontFamily: fonts.regular, fontSize: 14, color: colors.danger },
  cta: { marginTop: 22 },
});
