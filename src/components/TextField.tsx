import { useState, type ComponentRef, type Ref } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius } from '@/theme';

export type TextFieldHandle = ComponentRef<typeof TextInput>;

type Props = Omit<TextInputProps, 'ref'> & { error?: string; ref?: Ref<TextFieldHandle> };

/** Filled pill input. The placeholder doubles as the accessible label. */
export function TextField({ ref, error, style, onFocus, onBlur, placeholder, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <TextInput
        ref={ref}
        placeholder={placeholder}
        accessibilityLabel={placeholder}
        placeholderTextColor={colors.placeholder}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          focused && styles.focused,
          !!error && styles.invalid,
          style,
        ]}
        {...rest}
      />
      {!!error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    paddingHorizontal: 26,
    fontFamily: fonts.regular,
    fontSize: 17,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  focused: { borderColor: colors.green, backgroundColor: colors.white },
  invalid: { borderColor: colors.danger },
  error: {
    marginTop: 6,
    marginLeft: 26,
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
});
