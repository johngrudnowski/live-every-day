import {
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LedText, colors, radii, spacing } from '@led/design-system';

export function LabImportField({
  label,
  value,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  style,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: StyleProp<ViewStyle>;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={[styles.field, style]}>
      <LedText variant="label" color="predawn">
        {label}
      </LedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLite}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
  },
});
