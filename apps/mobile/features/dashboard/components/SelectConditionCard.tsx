import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { LedText, PrimaryButton, colors, radii, shadows, spacing } from '@led/design-system';
import type { ConditionSummary } from '@/features/conditions/api/condition-queries';

type SelectConditionCardProps = {
  draftProfile?: ConditionSummary['draftConditionProfile'];
  draftResumeStepId?: string;
};

export function SelectConditionCard({ draftProfile, draftResumeStepId }: SelectConditionCardProps) {
  const hasDraft = Boolean(draftProfile);

  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <LedText variant="label" color="predawn">
          {hasDraft ? 'Incomplete profile' : 'Getting started'}
        </LedText>
        <LedText variant="title">
          {hasDraft ? 'Finish your condition profile' : 'Select your condition to get started'}
        </LedText>
        <LedText variant="body" color="textMid">
          {hasDraft
            ? 'Your progress is saved. Pick up where you left off whenever you are ready.'
            : 'We will tailor check-ins, labs, research, and reminders around what you are managing.'}
        </LedText>
      </View>
      <PrimaryButton
        label={hasDraft ? 'Resume profile' : 'Choose condition'}
        onPress={() => {
          if (draftProfile) {
            router.push({
              pathname: '/conditions/[conditionId]',
              params: {
                conditionId: draftProfile.conditionId,
                stepId: draftResumeStepId,
              },
            });
            return;
          }

          router.push('/conditions');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    padding: spacing.xl,
    ...shadows.card,
  },
  copy: {
    gap: spacing.sm,
  },
});
