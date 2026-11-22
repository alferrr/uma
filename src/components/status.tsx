import { StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import type { Status } from '@/lib/zones';
import { fonts, statusColors } from '@/theme';
import { CheckIcon, DropIcon, QuestionIcon, WarningIcon } from './icons';

export function StatusIcon({ status, size = 18, color }: { status: Status; size?: number; color: string }) {
  switch (status) {
    case 'ok':
      return <CheckIcon size={size} color={color} />;
    case 'needs_water':
      return <DropIcon size={size} color={color} />;
    case 'dead':
      return <WarningIcon size={size} color={color} />;
    default:
      return <QuestionIcon size={size} color={color} />;
  }
}

/** Dark frosted label used over imagery: "● Z-04 Water". */
export function StatusTag({
  code,
  status,
  deadCount,
  highlighted,
}: {
  code?: string;
  status: Status;
  deadCount?: number;
  highlighted?: boolean;
}) {
  const t = useT();
  const word = status === 'dead' && deadCount ? `${deadCount} ${t.dead}` : t.statusShort[status];
  return (
    <View style={[styles.tag, highlighted && styles.tagOn]}>
      <View style={[styles.dot, { backgroundColor: statusColors[status] }]} />
      {code && <Text style={styles.code}>{code}</Text>}
      <Text style={styles.word}>{word}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    paddingHorizontal: 13,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30,40,25,0.55)',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tagOn: { borderColor: '#FFFFFF' },
  dot: { width: 9, height: 9, borderRadius: 5 },
  code: { fontFamily: fonts.semibold, fontSize: 15, color: '#FFFFFF' },
  word: { fontFamily: fonts.regular, fontSize: 15, color: 'rgba(255,255,255,0.9)' },
});
