import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LeafLogo } from '@/components/icons';
import { PillButton } from '@/components/PillButton';
import { getUser, signOut } from '@/lib/auth';
import { colors, fonts } from '@/theme';

/**
 * Temporary landing after sign-in. Language, Home, Map, Scan and Check-in
 * (product.md §6, screens 4–10) are the next build steps.
 */
export default function HomePlaceholder() {
  const insets = useSafeAreaInsets();
  const user = getUser();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
      <LeafLogo />
      <Text style={styles.title}>
        Hi, <Text style={styles.strong}>{user?.name ?? 'there'}</Text>
      </Text>
      <Text style={styles.body}>
        You are signed in as {user?.role === 'worker' ? 'a worker' : 'an owner'}. The farm screens
        come next.
      </Text>
      <View style={styles.cta}>
        <PillButton
          label="Sign out"
          onPress={async () => {
            await signOut();
            router.replace('/');
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 30 },
  title: { marginTop: 24, fontFamily: fonts.light, fontSize: 36, color: colors.text },
  strong: { fontFamily: fonts.bold, color: colors.green },
  body: { marginTop: 12, fontFamily: fonts.regular, fontSize: 17, lineHeight: 26, color: colors.muted },
  cta: { marginTop: 'auto' },
});
