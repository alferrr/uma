import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GreenStripes } from '@/components/art';
import { AuthLayout } from '@/components/AuthLayout';
import { ChevronLeft } from '@/components/icons';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField, type TextFieldHandle } from '@/components/TextField';
import { useCurrentFarm, useZone } from '@/lib/db';
import { canManageFarm, saveZone } from '@/lib/farms';
import { useT } from '@/lib/i18n';
import { colors, fonts } from '@/theme';

type Errors = { code?: string; form?: string };

/** Add a zone, or edit one with `?id=`. Only the farm's owner can save. */
export default function AddZone() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = useZone(id);
  const farm = useCurrentFarm();
  const canSave = canManageFarm(farm);

  const [code, setCode] = useState(editing?.code ?? '');
  const [area, setArea] = useState(editing?.area ?? '');
  const [row, setRow] = useState(editing?.row ?? '');
  const [plant, setPlant] = useState(editing?.plant ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const areaRef = useRef<TextFieldHandle>(null);
  const rowRef = useRef<TextFieldHandle>(null);
  const plantRef = useRef<TextFieldHandle>(null);

  async function submit() {
    if (!farm) {
      setErrors({ form: t.addFarmFirst });
      return;
    }
    if (!code.trim()) {
      setErrors({ code: t.codeRequired });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await saveZone({
        id: editing?.id,
        farm_id: farm.id,
        code,
        area,
        row_label: row,
        plant,
      });
      if (res.error === 'taken') setErrors({ code: t.codeTaken });
      else if (res.error === 'forbidden') setErrors({ form: t.ownersOnly });
      else if (res.error) setErrors({ form: t.zoneSaveFailed });
      else router.back();
    } catch {
      setErrors({ form: t.zoneSaveFailed });
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
            <Text style={styles.titleStrong}>{t.zoneWord}</Text>
          </Text>
        </>
      }
    >
      <View style={styles.fields}>
        <TextField
          placeholder={t.zoneCode}
          value={code}
          onChangeText={setCode}
          error={errors.code}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => areaRef.current?.focus()}
        />
        <TextField
          ref={areaRef}
          placeholder={t.zoneArea}
          value={area}
          onChangeText={setArea}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => rowRef.current?.focus()}
        />
        <TextField
          ref={rowRef}
          placeholder={t.zoneRow}
          value={row}
          onChangeText={setRow}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => plantRef.current?.focus()}
        />
        <TextField
          ref={plantRef}
          placeholder={t.zonePlant}
          value={plant}
          onChangeText={setPlant}
          returnKeyType="done"
        />
      </View>

      {!canSave && <Text style={styles.formError}>{t.ownersOnly}</Text>}
      {!!errors.form && (
        <Text style={styles.formError} accessibilityLiveRegion="polite">
          {errors.form}
        </Text>
      )}
      <View style={styles.cta}>
        <PrimaryButton label={t.saveZone} onPress={submit} loading={loading} disabled={!canSave} />
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
  fields: { gap: 14 },
  formError: { marginTop: 14, fontFamily: fonts.regular, fontSize: 14, color: colors.danger },
  cta: { marginTop: 22 },
});
