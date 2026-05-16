import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LedText, spacing } from '@led/design-system';

export function SectionHeader({ action, title }: { action?: ReactNode; title: string }) {
  return (
    <View style={styles.header}>
      <LedText variant="label" color="predawn" style={styles.title}>
        {title}
      </LedText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    flexShrink: 1,
  },
});
