import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GreenStripes } from '@/components/art';
import { AuthLayout } from '@/components/AuthLayout';
import { ChevronLeft } from '@/components/icons';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField, type TextFieldHandle } from '@/components/TextField';
import { getUser } from '@/lib/auth';
import { newId, upsertZone } from '@/lib/db';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { syncNow } from '@/lib/sync';
import { colors, fonts } from '@/theme';

type Errors = { code?: string; form?: string };

/** Add a zone. Owners only; saved to Supabase when configured, else on the phone. */
export default function AddZone() {
  const t = useT();
  const [code, setCode] = useState('');
  const [area, setArea] = useState('');
  const [row, setRow] = useState('');
  const [plant, setPlant] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const areaRef = useRef<TextFieldHandle>(null);
  const rowRef = useRef<TextFieldHandle>(null);
  const plantRef = useRef<TextFieldHandle>(null);

  const isOwner = getUser()?.role === 'owner';

  async function submit() {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setErrors({ code: t.codeRequired });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const fields = {
        code: clean,
        area: area.trim(),
        row_label: row.trim(),
        plant: plant.trim() || null,
      };
      if (supabase) {
        const { data, error } = await supabase
          .from('zones')
          .insert(fields)
          .select('id, code, area, row_label')
          .single();
        if (error) {
          // 23505 = unique code already used; 42501 = row-level security refused it.
          if (error.code === '23505') setErrors({ code: t.codeTaken });
          else if (error.code === '42501') setErrors({ form: t.ownersOnly });
          else setErrors({ form: t.zoneSaveFailed });
          return;
        }
        upsertZone(data);
        syncNow();
      } else {
        upsertZone({ id: newId(), code: clean, area: fields.area, row_label: fields.row_label });
      }
      router.back();
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
            {t.addA}
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

      {!isOwner && <Text style={styles.formError}>{t.ownersOnly}</Text>}
      {!!errors.form && (
        <Text style={styles.formError} accessibilityLiveRegion="polite">
          {errors.form}
        </Text>
      )}
      <View style={styles.cta}>
        <PrimaryButton label={t.saveZone} onPress={submit} loading={loading} disabled={!isOwner} />
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
