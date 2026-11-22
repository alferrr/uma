import Constants from 'expo-constants';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GreenStripes } from '@/components/art';
import { AuthLayout } from '@/components/AuthLayout';
import {
  ChevronLeft,
  ChevronRight,
  GlobeIcon,
  LogOutIcon,
  PinIcon,
  SyncIcon,
} from '@/components/icons';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { getUser, signOut, updateName } from '@/lib/auth';
import { useCurrentFarm, useFarms, useUnsyncedCount } from '@/lib/db';
import { useLanguage, useT } from '@/lib/i18n';
import { syncNow } from '@/lib/sync';
import { colors, fonts } from '@/theme';

const LANGUAGE_NAMES = { ceb: 'Cebuano', en: 'English', tl: 'Tagalog' } as const;

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || 'U'
  );
}

/** Profile and settings: account, language, farms, sync and sign out. */
export default function Profile() {
  const t = useT();
  const lang = useLanguage() ?? 'en';
  const user = getUser();
  const farm = useCurrentFarm();
  const farmCount = useFarms().length;
  const pending = useUnsyncedCount();

  const [name, setName] = useState(user?.name ?? '');
  const [nameMsg, setNameMsg] = useState<{ text: string; ok: boolean }>();
  const [savingName, setSavingName] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const changed = name.trim() !== (user?.name ?? '');

  async function saveName() {
    if (!name.trim()) {
      setNameMsg({ text: t.nameRequired, ok: false });
      return;
    }
    setSavingName(true);
    try {
      await updateName(name);
      setNameMsg({ text: t.nameSaved, ok: true });
    } catch {
      setNameMsg({ text: t.nameSaveFailed, ok: false });
    } finally {
      setSavingName(false);
    }
  }

  async function sync() {
    setSyncing(true);
    await syncNow();
    setSyncing(false);
  }

  async function logOut() {
    await signOut();
    router.replace('/');
  }

  return (
    <AuthLayout
      heroRatio={0.3}
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
          <View style={styles.heroRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(user?.name ?? '')}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
                {t.profile}
              </Text>
              <Text style={styles.sub}>{t.profileSub}</Text>
            </View>
          </View>
        </>
      }
    >
      <Text style={styles.section}>{t.account}</Text>
      <TextField
        placeholder={t.nameLabel}
        value={name}
        onChangeText={(v) => {
          setName(v);
          setNameMsg(undefined);
        }}
        autoCapitalize="words"
        textContentType="name"
        returnKeyType="done"
        onSubmitEditing={saveName}
        error={nameMsg && !nameMsg.ok ? nameMsg.text : undefined}
      />
      {nameMsg?.ok && <Text style={styles.ok}>{nameMsg.text}</Text>}
      {changed && (
        <View style={styles.saveName}>
          <PrimaryButton label={t.saveName} onPress={saveName} loading={savingName} />
        </View>
      )}

      <View style={styles.card}>
        <InfoRow label={t.contactLabel} value={user?.contact || '—'} />
        <InfoRow label={t.roleLabel} value={t.roles[user?.role ?? 'owner']} last />
      </View>

      <Text style={styles.section}>{t.farmsTitle}</Text>
      <View style={styles.card}>
        <NavRow
          icon={<GlobeIcon size={22} color={colors.green} />}
          label={t.language}
          value={LANGUAGE_NAMES[lang]}
          onPress={() => router.push('/language')}
        />
        <NavRow
          icon={<PinIcon size={22} color={colors.green} />}
          label={t.manageFarms}
          value={farm ? `${farm.name}${farmCount > 1 ? ` +${farmCount - 1}` : ''}` : t.noFarmsYet}
          onPress={() => router.push('/farms')}
          last
        />
      </View>

      <Text style={styles.section}>{t.syncTitle}</Text>
      <View style={styles.card}>
        <View style={styles.syncRow}>
          <SyncIcon size={22} color={colors.green} />
          <Text style={styles.syncText}>{pending === 0 ? t.allSynced : t.notSynced(pending)}</Text>
          <Pressable
            onPress={sync}
            disabled={syncing}
            accessibilityRole="button"
            style={({ pressed }) => [styles.syncBtn, (pressed || syncing) && { opacity: 0.7 }]}
          >
            <Text style={styles.syncBtnText}>{syncing ? t.syncing : t.syncNow}</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={logOut}
        accessibilityRole="button"
        style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.7 }]}
      >
        <LogOutIcon size={20} color={colors.danger} />
        <Text style={styles.signOutText}>{t.signOut}</Text>
      </Pressable>

      <Text style={styles.version}>
        {t.versionLabel} {Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </AuthLayout>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      style={[styles.info, !last && styles.divider]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function NavRow({
  icon,
  label,
  value,
  onPress,
  last,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [styles.nav, !last && styles.divider, pressed && { opacity: 0.7 }]}
    >
      {icon}
      <Text style={styles.navLabel}>{label}</Text>
      <Text style={styles.navValue} numberOfLines={1}>
        {value}
      </Text>
      <ChevronRight size={16} color={colors.muted} />
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
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.semibold, fontSize: 24, color: colors.green },
  title: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 38, color: colors.white },
  sub: { fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  section: {
    marginTop: 24,
    marginBottom: 10,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  ok: {
    marginTop: 6,
    marginLeft: 26,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.green,
  },
  saveName: { marginTop: 12 },
  card: { marginTop: 12, borderRadius: 24, backgroundColor: colors.bg, overflow: 'hidden' },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#DADAD4' },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  infoLabel: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
  infoValue: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  navLabel: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  navValue: { maxWidth: '45%', fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingLeft: 18 },
  syncText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  syncBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    backgroundColor: colors.green,
    justifyContent: 'center',
  },
  syncBtnText: { fontFamily: fonts.medium, fontSize: 14, color: colors.white },
  signOut: {
    marginTop: 26,
    height: 58,
    borderRadius: 29,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  signOutText: { fontFamily: fonts.medium, fontSize: 17, color: colors.danger },
  version: {
    marginTop: 18,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
  },
});
