import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppScreen, LedText, PrimaryButton, colors, radii, spacing } from '@led/design-system';
import type { ConditionDefinition } from '@led/conditions';

import { ConditionFlowHeader } from './ConditionFlowHeader';

type ComingSoonScreenProps = {
  condition?: Pick<ConditionDefinition, 'label' | 'subtitle'>;
};

export function ComingSoonScreen({ condition }: ComingSoonScreenProps) {
  return (
    <AppScreen padded={false} style={styles.screen}>
      <ConditionFlowHeader title="About your diagnosis" onBack={() => router.back()} />
      <View style={styles.content}>
        <View style={styles.icon}>
          <LedText variant="title" color="midday">
            ...
          </LedText>
        </View>
        <LedText variant="title" align="center">
          {condition?.label ?? 'Coming soon'}
        </LedText>
        <LedText variant="body" color="textMid" align="center">
          This condition path is in development. We're building each one with specialist input to
          get it right.
        </LedText>
        {condition?.subtitle ? (
          <LedText variant="bodySmall" color="textLite" align="center">
            {condition.subtitle}
          </LedText>
        ) : null}
        <PrimaryButton
          label="Back to conditions"
          variant="secondary"
          onPress={() => router.replace('/conditions')}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
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
