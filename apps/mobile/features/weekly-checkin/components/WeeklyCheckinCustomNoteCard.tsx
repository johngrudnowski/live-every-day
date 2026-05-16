import { StyleSheet, TextInput, View } from 'react-native';
import { LedText, colors, radii, spacing } from '@led/design-system';

type WeeklyCheckinCustomNoteCardProps = {
  value: string;
  onChangeText: (value: string) => void;
  footerText?: string;
};

export function WeeklyCheckinCustomNoteCard({
  value,
  onChangeText,
  footerText,
}: WeeklyCheckinCustomNoteCardProps) {
  return (
    <View style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <LedText variant="subtitle" style={styles.noteTitle}>
          Anything else to add?
        </LedText>
        <LedText variant="bodySmall" color="predawn">
          How does this week really feel? Your words - no structure needed.
        </LedText>
      </View>
      <View style={styles.noteBody}>
        <TextInput
          multiline
          value={value}
          onChangeText={onChangeText}
          placeholder="Type anything you want your brief to capture"
          placeholderTextColor={colors.textLite}
          style={styles.noteInput}
        />
        {footerText ? (
          <LedText variant="bodySmall" color="midday">
            {footerText}
          </LedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  noteCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  noteHeader: {
    gap: spacing.xxs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  noteTitle: {
    fontSize: 14,
    lineHeight: 19,
  },
  noteBody: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  noteInput: {
    minHeight: 108,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    backgroundColor: colors.canvas,
    padding: spacing.md,
    color: colors.text,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
});
