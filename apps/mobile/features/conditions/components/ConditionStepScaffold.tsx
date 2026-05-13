import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LedText, spacing } from '@led/design-system';

type ConditionStepScaffoldProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions: ReactNode;
};

export function ConditionStepScaffold({
  eyebrow,
  title,
  subtitle,
  children,
  actions,
}: ConditionStepScaffoldProps) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        {eyebrow ? (
          <LedText variant="label" color="midday">
            {eyebrow}
          </LedText>
        ) : null}
        <LedText variant="displayMedium">{title}</LedText>
        {subtitle ? (
          <LedText variant="body" color="textMid">
            {subtitle}
          </LedText>
        ) : null}
      </View>
      <View style={styles.content}>{children}</View>
      <View style={styles.actions}>{actions}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  copy: {
    gap: spacing.sm,
  },
  content: {
    flex: 1,
    gap: spacing.md,
  },
  actions: {
    paddingTop: spacing.sm,
  },
});
