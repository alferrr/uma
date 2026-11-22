import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GreenStripes } from '@/components/art';
import { AuthLayout } from '@/components/AuthLayout';
import { BackHero } from '@/components/BackHero';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { joinFarm } from '@/lib/farms';
import { useT } from '@/lib/i18n';

/** Join a farm with the invite code its owner shared. */
export default function JoinFarm() {
  const t = useT();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!code.trim()) {
      setError(t.codeInvalid);
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      const res = await joinFarm(code);
      if (res.error) setError(res.error === 'invalid' ? t.codeInvalid : t.joinFailed);
      else router.dismissTo('/home');
    } catch {
      setError(t.joinFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      heroRatio={0.27}
      art={<GreenStripes />}
      hero={<BackHero lead={t.joinA} strong={t.farmWord} />}
    >
      <TextField
        placeholder={t.inviteCode}
        value={code}
        onChangeText={setCode}
        error={error}
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <View style={styles.cta}>
        <PrimaryButton label={t.joinButton} onPress={submit} loading={loading} />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({ cta: { marginTop: 22 } });
