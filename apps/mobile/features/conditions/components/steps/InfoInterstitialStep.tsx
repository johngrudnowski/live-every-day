import { StyleSheet, View } from 'react-native';
import { LedText, colors, radii, spacing } from '@led/design-system';
import type { ConditionStepProps } from './types';

export function InfoInterstitialStep({ step }: ConditionStepProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.icon}>
        <LedText variant="title" color="midday">
          ...
        </LedText>
      </View>
      <LedText variant="title" align="center">
        {step.title}
      </LedText>
      {step.subtitle ? (
        <LedText variant="body" color="textMid" align="center">
          {step.subtitle}
        </LedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  icon: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
});
