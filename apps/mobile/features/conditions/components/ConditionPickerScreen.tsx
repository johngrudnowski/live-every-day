import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppScreen, CardOption, LedText, PrimaryButton, colors, spacing } from '@led/design-system';

import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import {
  useConditionRegistryQuery,
  useSkipConditionOnboardingMutation,
} from '../api/condition-queries';
import { ConditionFlowHeader } from './ConditionFlowHeader';

export function ConditionPickerScreen() {
  const registryQuery = useConditionRegistryQuery();
  const skipMutation = useSkipConditionOnboardingMutation();

  async function handleSkip() {
    await skipMutation.mutateAsync();
    router.replace('/home');
  }

  if (registryQuery.isPending) {
    return <LoadingScreen message="Loading conditions" />;
  }

  if (registryQuery.isError) {
    return (
      <AppScreen padded={false} style={styles.screen}>
        <ConditionFlowHeader title="About your diagnosis" onBack={() => router.back()} />
        <View style={styles.emptyState}>
          <LedText variant="title" align="center">
            Unable to load conditions
          </LedText>
          <PrimaryButton label="Try again" onPress={() => void registryQuery.refetch()} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen padded={false} style={styles.screen}>
      <ConditionFlowHeader
        title="About your diagnosis"
        progressValue={1}
        progressMax={5}
        onBack={() => router.back()}
        onSkip={() => void handleSkip()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.copy}>
          <LedText variant="displayMedium">What's your diagnosis?</LedText>
          <LedText variant="body" color="textMid">
            We'll tailor the app to the specifics of your condition.
          </LedText>
        </View>

        <View style={styles.list}>
          {(registryQuery.data ?? []).map((condition) => (
            <CardOption
              key={condition.id}
              title={condition.label}
              subtitle={
                condition.status === 'coming_soon'
                  ? `${condition.subtitle} - coming soon`
                  : condition.subtitle
              }
              onPress={() => router.push(`/conditions/${condition.id}`)}
            />
          ))}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  copy: {
    gap: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
});
