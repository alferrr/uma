import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GreenStripes, SunsetField } from '@/components/art';
import { AuthLayout } from '@/components/AuthLayout';
import { ChevronLeft } from '@/components/icons';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField, type TextFieldHandle } from '@/components/TextField';
import { isEmailOrPhone, signUp, type Role } from '@/lib/auth';
import { afterSignInRoute, useT } from '@/lib/i18n';
import { colors, fonts } from '@/theme';

type Field = 'name' | 'contact' | 'password' | 'confirm' | 'form';
type Errors = Partial<Record<Field, string>>;

/** Screen 3 · Sign up */
export default function SignUp() {
  const t = useT();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<Role>('owner');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const contactRef = useRef<TextFieldHandle>(null);
  const passwordRef = useRef<TextFieldHandle>(null);
  const confirmRef = useRef<TextFieldHandle>(null);

  async function submit() {
    const next: Errors = {};
    if (!name.trim()) next.name = t.nameRequired;
    if (!isEmailOrPhone(contact)) next.contact = t.contactInvalid;
    if (password.length < 6) next.password = t.passwordShort;
    if (confirm !== password) next.confirm = t.passwordsDontMatch;
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await signUp({ name: name.trim(), contact: contact.trim(), role }, password);
      router.replace(afterSignInRoute());
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : t.signUpFailed });
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/sign-in');
  }

  return (
    <AuthLayout
      heroRatio={0.27}
      art={<SunsetField />}
      hero={
        <>
          <StatusBar style="light" />
          <Pressable
            onPress={goBack}
            style={({ pressed }) => [styles.back, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={t.back}
            hitSlop={8}
          >
            <ChevronLeft />
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            {t.createYour}
            {'\n'}
            <Text style={styles.titleStrong}>{t.accountWord}</Text>
          </Text>
        </>
      }
    >
      <View style={styles.fields}>
        <TextField
          placeholder={t.fullName}
          value={name}
          onChangeText={setName}
          error={errors.name}
          autoCapitalize="words"
          textContentType="name"
          autoComplete="name"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => contactRef.current?.focus()}
        />
        <TextField
          ref={contactRef}
          placeholder={t.contactLabel}
          value={contact}
          onChangeText={setContact}
          error={errors.contact}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="username"
          autoComplete="username"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          ref={passwordRef}
          placeholder={t.passwordLabel}
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
        <TextField
          ref={confirmRef}
          placeholder={t.confirmPassword}
          value={confirm}
          onChangeText={setConfirm}
          error={errors.confirm}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          returnKeyType="done"
        />
      </View>

      <Text style={styles.label} nativeID="role-label">
        {t.iAmA}
      </Text>
      <View
        style={styles.roles}
        accessibilityRole="radiogroup"
        accessibilityLabelledBy="role-label"
      >
        <RoleChip
          label={t.roles.owner}
          selected={role === 'owner'}
          onPress={() => setRole('owner')}
          thumb={<GreenStripes />}
        />
        <RoleChip
          label={t.roles.worker}
          selected={role === 'worker'}
          onPress={() => setRole('worker')}
          thumb={<SunsetField />}
        />
      </View>

      {!!errors.form && (
        <Text style={styles.formError} accessibilityLiveRegion="polite">
          {errors.form}
        </Text>
      )}
      <PrimaryButton label={t.createAccount} onPress={submit} loading={loading} />
    </AuthLayout>
  );
}

function RoleChip({
  label,
  selected,
  onPress,
  thumb,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  thumb: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipOn : styles.chipOff,
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={styles.chipThumb}>{thumb}</View>
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
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
  formError: { fontFamily: fonts.regular, fontSize: 14, color: colors.danger, marginBottom: 12 },
  label: {
    marginTop: 22,
    marginBottom: 12,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
  },
  roles: { flexDirection: 'row', gap: 12, marginBottom: 26 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 60,
    paddingLeft: 6,
    paddingRight: 24,
    borderRadius: 30,
  },
  chipOn: { backgroundColor: colors.orange },
  chipOff: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  chipThumb: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  chipText: { fontFamily: fonts.medium, fontSize: 18, color: colors.text },
  chipTextOn: { color: colors.white },
});
