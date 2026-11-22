import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon, LeafLogo } from '@/components/icons';
import { PrimaryButton } from '@/components/PrimaryButton';
import { setLanguage, STRINGS, useLanguage, type Lang } from '@/lib/i18n';
import { colors, fonts } from '@/theme';

const OPTIONS: { lang: Lang; short: string; name: string; sample: string }[] = [
  { lang: 'ceb', short: 'CEB', name: 'Cebuano', sample: 'Bantayi ang matag tanom' },
  { lang: 'en', short: 'EN', name: 'English', sample: 'Watch every plant' },
  { lang: 'tl', short: 'TL', name: 'Tagalog', sample: 'Bantayan ang bawat halaman' },
];

/** Screen 4 · Language. Shown after first sign-in, and from the account menu. */
export default function Language() {
  const insets = useSafeAreaInsets();
  const saved = useLanguage();
  const [lang, setLang] = useState<Lang>(saved ?? 'en');
  // Preview the headline in the language being picked.
  const t = STRINGS[lang];

  function done() {
    setLanguage(lang);
    if (router.canGoBack() && saved) router.back();
    else router.replace('/home');
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <LeafLogo size={54} />
        <Text style={styles.title} accessibilityRole="header">
          {t.chooseYour}
          {'\n'}
          <Text style={styles.titleStrong}>{t.language}</Text>
        </Text>
        <Text style={styles.sub}>Pilia ang pinulongan · Piliin ang wika</Text>

        <View style={styles.list} accessibilityRole="radiogroup">
          {OPTIONS.map((o) => {
            const on = o.lang === lang;
            return (
              <Pressable
                key={o.lang}
                onPress={() => setLang(o.lang)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on, selected: on }}
                accessibilityLabel={o.name}
                style={({ pressed }) => [styles.option, on && styles.optionOn, pressed && styles.pressed]}
              >
                <View style={[styles.badge, on && styles.badgeOn]}>
                  <Text style={[styles.badgeText, on && styles.badgeTextOn]}>{o.short}</Text>
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.name, on && styles.white]}>{o.name}</Text>
                  <Text style={[styles.sample, on && styles.whiteSoft]}>{o.sample}</Text>
                </View>
                <View style={[styles.radio, on && styles.radioOn]}>
                  {on && <CheckIcon size={16} color={colors.orange} strokeWidth={2.4} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.note}>{t.changeInSettings}</Text>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + 20 }]}>
        <PrimaryButton label={t.continue} onPress={done} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  title: {
    marginTop: 22,
    fontFamily: fonts.regular,
    fontSize: 38,
    lineHeight: 46,
    color: colors.text,
    letterSpacing: -0.6,
  },
  titleStrong: { fontFamily: fonts.bold, color: colors.green },
  sub: { marginTop: 8, fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  list: { marginTop: 28, gap: 14 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    paddingRight: 20,
    borderRadius: 28,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  optionOn: { backgroundColor: colors.orange },
  pressed: { transform: [{ scale: 0.98 }] },
  badge: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOn: { backgroundColor: colors.white },
  badgeText: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text },
  badgeTextOn: { color: colors.orange },
  optionText: { flex: 1, gap: 4 },
  name: { fontFamily: fonts.medium, fontSize: 20, color: colors.text },
  sample: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  white: { color: colors.white },
  whiteSoft: { color: 'rgba(255,255,255,0.85)' },
  radio: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C9C9C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: colors.white, borderColor: colors.white },
  note: { marginTop: 22, textAlign: 'center', fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  cta: { paddingHorizontal: 24, paddingTop: 8 },
});
