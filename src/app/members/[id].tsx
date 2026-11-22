import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { GreenStripes } from '@/components/art';
import { AuthLayout } from '@/components/AuthLayout';
import { BackHero } from '@/components/BackHero';
import { LogOutIcon, UserIcon } from '@/components/icons';
import { PrimaryButton } from '@/components/PrimaryButton';
import { getUser } from '@/lib/auth';
import { useFarm, useMembers } from '@/lib/db';
import { canManageFarm, leaveFarm, removeMember } from '@/lib/farms';
import { useT } from '@/lib/i18n';
import { colors, fonts } from '@/theme';

/** Who is on a farm. The owner shares the invite code and can remove people; workers can leave. */
export default function Members() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const farm = useFarm(id);
  const members = useMembers(id);
  const isOwner = canManageFarm(farm);
  const me = getUser()?.id;

  if (!farm) return null;
  const farmName = farm.name;

  function confirmRemove(userId: string, name: string) {
    Alert.alert(t.removeMemberTitle(name || t.roles.worker), t.removeMemberBody, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.removeMember,
        style: 'destructive',
        onPress: async () => {
          const error = await removeMember(farm!.id, userId);
          if (error) Alert.alert(error === 'forbidden' ? t.ownersOnlyFarm : t.deleteFailed);
        },
      },
    ]);
  }

  function confirmLeave() {
    Alert.alert(t.leaveFarmTitle(farmName), t.leaveFarmBody, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.leaveFarm,
        style: 'destructive',
        onPress: async () => {
          const error = await leaveFarm(farm!.id);
          if (error) Alert.alert(t.deleteFailed);
          else router.dismissTo('/home');
        },
      },
    ]);
  }

  return (
    <AuthLayout
      heroRatio={0.27}
      art={<GreenStripes />}
      hero={<BackHero lead={farmName} strong={t.members} />}
    >
      {isOwner && farm.invite_code && (
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>{t.inviteCode}</Text>
          <Text
            style={styles.code}
            selectable
            accessibilityLabel={farm.invite_code.split('').join(' ')}
          >
            {farm.invite_code}
          </Text>
          <Text style={styles.codeHint}>{t.inviteHint}</Text>
          <View style={styles.share}>
            <PrimaryButton
              label={t.shareCode}
              onPress={() => Share.share({ message: t.shareMessage(farmName, farm.invite_code!) })}
            />
          </View>
        </View>
      )}

      <View style={styles.list}>
        <Person
          name={farm.owner_name || t.roles.owner}
          role={t.roles.owner}
          you={farm.owner_id === me}
          youTag={t.youTag}
        />
        {members
          .filter((m) => m.user_id !== farm.owner_id)
          .map((m) => (
            <Person
              key={m.user_id}
              name={m.name || t.roles.worker}
              role={t.roles.worker}
              you={m.user_id === me}
              youTag={t.youTag}
              onRemove={isOwner ? () => confirmRemove(m.user_id, m.name) : undefined}
              removeLabel={t.removeMember}
            />
          ))}
      </View>
      {isOwner && members.length === 0 && <Text style={styles.empty}>{t.noMembers}</Text>}

      {!isOwner && (
        <Pressable
          onPress={confirmLeave}
          accessibilityRole="button"
          style={({ pressed }) => [styles.leave, pressed && { opacity: 0.7 }]}
        >
          <LogOutIcon size={20} color={colors.danger} />
          <Text style={styles.leaveText}>{t.leaveFarm}</Text>
        </Pressable>
      )}
    </AuthLayout>
  );
}

function Person({
  name,
  role,
  you,
  youTag,
  onRemove,
  removeLabel,
}: {
  name: string;
  role: string;
  you: boolean;
  youTag: string;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  return (
    <View style={styles.person}>
      <View style={styles.avatar}>
        <UserIcon size={20} color={colors.green} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
          {you ? ` (${youTag})` : ''}
        </Text>
        <Text style={styles.role}>{role}</Text>
      </View>
      {onRemove && (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`${removeLabel}: ${name}`}
          hitSlop={8}
          style={({ pressed }) => [styles.remove, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.removeText}>{removeLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  codeCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#EAF5EC',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  codeLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.green },
  code: { fontFamily: fonts.semibold, fontSize: 30, letterSpacing: 3, color: colors.text },
  codeHint: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, textAlign: 'center' },
  share: { alignSelf: 'stretch', marginTop: 10 },
  list: { gap: 10 },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 22,
    backgroundColor: colors.bg,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  role: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  remove: { paddingHorizontal: 12, paddingVertical: 8 },
  removeText: { fontFamily: fonts.medium, fontSize: 14, color: colors.danger },
  empty: {
    marginTop: 14,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.muted,
  },
  leave: {
    marginTop: 26,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  leaveText: { fontFamily: fonts.medium, fontSize: 16, color: colors.danger },
});
