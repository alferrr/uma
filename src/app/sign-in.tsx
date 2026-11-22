import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GreenStripes } from '@/components/art';
import { AuthLayout } from '@/components/AuthLayout';
import { LeafLogo, WifiIcon } from '@/components/icons';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField, type TextFieldHandle } from '@/components/TextField';
import { isEmailOrPhone, signIn } from '@/lib/auth';
import { afterSignInRoute, useT } from '@/lib/i18n';
import { colors, fonts } from '@/theme';

type Errors = { contact?: string; password?: string; form?: string };

/** Screen 2 · Sign in */
export default function SignIn() {
  const t = useT();
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextFieldHandle>(null);

  async function submit() {
    const next: Errors = {};
    if (!isEmailOrPhone(contact)) next.contact = t.contactInvalid;
    if (!password) next.password = t.passwordRequired;
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await signIn(contact.trim(), password);
      router.replace(afterSignInRoute());
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : t.signInFailed });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      heroRatio={0.36}
      art={<GreenStripes />}
      hero={
        <>
          <StatusBar style="light" />
          <LeafLogo size={50} color={colors.white} />
          <Text style={styles.title} accessibilityRole="header">
            {t.welcomeWord}
            {'\n'}
            <Text style={styles.titleStrong}>{t.backWord}</Text>
          </Text>
        </>
      }
      footer={
        <Text style={styles.footerText}>
          {t.newToUma}{' '}
          <Link href="/sign-up" replace style={styles.footerLink}>
            {t.createAccount}
          </Link>
        </Text>
      }
    >
      <Text style={styles.heading}>{t.signIn}</Text>

      <View style={styles.fields}>
        <TextField
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
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior="submit"
        />
        <TextField
          ref={passwordRef}
          placeholder={t.passwordLabel}
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secureTextEntry
          textContentType="password"
          autoComplete="current-password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </View>

      <Pressable
        style={styles.forgot}
        hitSlop={10}
        accessibilityRole="button"
        onPress={() => router.push('/forgot-password')}
      >
        <Text style={styles.forgotText}>{t.forgotPassword}</Text>
      </Pressable>

      {!!errors.form && (
        <Text style={styles.formError} accessibilityLiveRegion="polite">
          {errors.form}
        </Text>
      )}
      <PrimaryButton label={t.signIn} onPress={submit} loading={loading} />

      <View style={styles.note}>
        <WifiIcon />
        <Text style={styles.noteText}>{t.internetNote}</Text>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.light,
    fontSize: 40,
    lineHeight: 46,
    color: colors.white,
    letterSpacing: -0.6,
  },
  titleStrong: { fontFamily: fonts.bold },
  heading: { fontFamily: fonts.medium, fontSize: 24, color: colors.text, marginBottom: 18 },
  fields: { gap: 16 },
  formError: { fontFamily: fonts.regular, fontSize: 14, color: colors.danger, marginBottom: 12 },
  forgot: { alignSelf: 'flex-end', marginTop: 16, marginBottom: 18 },
  forgotText: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, paddingLeft: 4 },
  noteText: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  footerText: { fontFamily: fonts.regular, fontSize: 16, color: colors.muted },
  footerLink: { fontFamily: fonts.bold, color: colors.green },
});
