import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GreenStripes } from '@/components/art';
import { AuthLayout } from '@/components/AuthLayout';
import { BackHero } from '@/components/BackHero';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField, type TextFieldHandle } from '@/components/TextField';
import { resetWithCode, sendResetCode } from '@/lib/auth';
import { afterSignInRoute, useT } from '@/lib/i18n';
import { isEmail } from '@/lib/validate';
import { colors, fonts } from '@/theme';

type Errors = { email?: string; code?: string; password?: string; form?: string };

/** Reset a forgotten password with a 6-digit code sent by email. */
export default function ForgotPassword() {
  const t = useT();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextFieldHandle>(null);

  async function send() {
    if (!isEmail(email)) {
      setErrors({ email: t.emailInvalid });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await sendResetCode(email);
      setStep('code');
    } catch {
      setErrors({ form: t.resetFailed });
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    const next: Errors = {};
    if (!/^\d{6}$/.test(code.trim())) next.code = t.codeWrong;
    if (password.length < 6) next.password = t.passwordShort;
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      await resetWithCode(email, code, password);
      router.replace(afterSignInRoute());
    } catch (e) {
      setErrors(
        (e as { badCode?: boolean }).badCode ? { code: t.codeWrong } : { form: t.resetFailed },
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      heroRatio={0.27}
      art={<GreenStripes />}
      hero={<BackHero lead={t.resetA} strong={t.passwordWord} />}
    >
      {step === 'email' ? (
        <>
          <Text style={styles.intro}>{t.forgotIntro}</Text>
          <TextField
            placeholder={t.emailLabel}
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={send}
          />
          {!!errors.form && <Text style={styles.error}>{errors.form}</Text>}
          <View style={styles.cta}>
            <PrimaryButton label={t.sendCode} onPress={send} loading={loading} />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.intro} accessibilityLiveRegion="polite">
            {t.codeSentTo(email.trim())}
          </Text>
          <View style={styles.fields}>
            <TextField
              placeholder={t.codeLabel}
              value={code}
              onChangeText={setCode}
              error={errors.code}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              maxLength={6}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextField
              ref={passwordRef}
              placeholder={t.newPassword}
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={reset}
            />
          </View>
          {!!errors.form && <Text style={styles.error}>{errors.form}</Text>}
          <View style={styles.cta}>
            <PrimaryButton label={t.setPassword} onPress={reset} loading={loading} />
          </View>
          <Pressable onPress={send} accessibilityRole="button" style={styles.resend} hitSlop={8}>
            <Text style={styles.resendText}>{t.resendCode}</Text>
          </Pressable>
        </>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginBottom: 16,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  fields: { gap: 14 },
  error: { marginTop: 12, fontFamily: fonts.regular, fontSize: 14, color: colors.danger },
  cta: { marginTop: 22 },
  resend: { alignSelf: 'center', marginTop: 16 },
  resendText: { fontFamily: fonts.medium, fontSize: 15, color: colors.green },
});
