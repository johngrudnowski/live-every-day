import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import {
  AppScreen,
  LedText,
  PrimaryButton,
  colors,
  spacing,
} from '@led/design-system';
import type { ConditionFlowStep, ConditionStepField, SemanticValue } from '@led/conditions';

import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import {
  useConditionDefinitionQuery,
  useSaveConditionProfileMutation,
  useSkipConditionOnboardingMutation,
} from '../api/condition-queries';
import { useConditionFlow } from '../hooks/useConditionFlow';
import { ComingSoonScreen } from './ComingSoonScreen';
import { ConditionFlowHeader } from './ConditionFlowHeader';
import { ConditionStepScaffold } from './ConditionStepScaffold';
import { ChipSelectStep } from './steps/ChipSelectStep';
import { FieldGroupStep } from './steps/FieldGroupStep';
import { GroupedToggleListStep } from './steps/GroupedToggleListStep';
import { InfoInterstitialStep } from './steps/InfoInterstitialStep';
import { MultiSelectCardsStep } from './steps/MultiSelectCardsStep';
import { SingleSelectCardsStep } from './steps/SingleSelectCardsStep';
import { YearPickerStep } from './steps/YearPickerStep';

type ConditionFlowRendererProps = {
  conditionId: string;
};

export function ConditionFlowRenderer({ conditionId }: ConditionFlowRendererProps) {
  const definitionQuery = useConditionDefinitionQuery(conditionId);

  if (definitionQuery.isPending) {
    return <LoadingScreen message="Loading condition path" />;
  }

  if (definitionQuery.isError || !definitionQuery.data) {
    return (
      <AppScreen padded={false} style={styles.screen}>
        <ConditionFlowHeader title="About your diagnosis" onBack={() => router.back()} />
        <ConditionStepScaffold
          title="We couldn't load that condition"
          subtitle="Please go back and choose a condition again."
          actions={<PrimaryButton label="Back to conditions" onPress={() => router.replace('/conditions')} />}
        >
          <LedText variant="body" color="textMid">
            The condition path may have moved or is not available.
          </LedText>
        </ConditionStepScaffold>
      </AppScreen>
    );
  }

  if (definitionQuery.data.status !== 'active') {
    return <ComingSoonScreen condition={definitionQuery.data} />;
  }

  return <ActiveConditionFlow conditionDefinition={definitionQuery.data} />;
}

function ActiveConditionFlow({
  conditionDefinition,
}: {
  conditionDefinition: NonNullable<ReturnType<typeof useConditionDefinitionQuery>['data']>;
}) {
  const flow = useConditionFlow(conditionDefinition);
  const saveMutation = useSaveConditionProfileMutation();
  const skipMutation = useSkipConditionOnboardingMutation();
  const currentStep = flow.currentStep;

  async function handleSkip() {
    await skipMutation.mutateAsync();
    router.replace('/home');
  }

  async function handleContinue() {
    if (!currentStep) {
      return;
    }

    if (!flow.isLastStep) {
      flow.seedDefaultValue(currentStep);
      flow.goNext();
      return;
    }

    flow.seedDefaultValue(currentStep);

    await saveMutation.mutateAsync({
      conditionId: conditionDefinition.id,
      conditionDefinitionVersion: conditionDefinition.version,
      values: flow.state.semanticValues as Record<string, SemanticValue>,
    });
    router.replace('/home');
  }

  if (!currentStep) {
    return <ComingSoonScreen condition={conditionDefinition} />;
  }

  const currentValue = currentStep.semanticKey ? flow.state.semanticValues[currentStep.semanticKey] : undefined;
  const continueDisabled =
    isRequiredValueMissing(currentStep, currentValue, flow.state.semanticValues) || saveMutation.isPending;

  return (
    <AppScreen padded={false} style={styles.screen}>
      <ConditionFlowHeader
        title="About your diagnosis"
        progressValue={Math.max(1, flow.currentIndex + 2)}
        progressMax={flow.visibleSteps.length + 1}
        onBack={() => {
          if (flow.isFirstStep) {
            router.replace('/conditions');
            return;
          }

          flow.goBack();
        }}
        onSkip={() => void handleSkip()}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ConditionStepScaffold
          eyebrow={currentStep.eyebrow}
          title={currentStep.title}
          subtitle={currentStep.subtitle}
          actions={
            <PrimaryButton
              label={flow.isLastStep ? 'Save and continue' : 'Continue'}
              fullWidth
              disabled={continueDisabled}
              onPress={() => void handleContinue()}
            />
          }
        >
          {renderStep(
            currentStep,
            currentValue,
            flow.state.semanticValues,
            (value) => flow.setValue(currentStep, value),
            (field, value) => flow.setValue(field, value),
          )}
        </ConditionStepScaffold>
      </ScrollView>
    </AppScreen>
  );
}

function renderStep(
  step: ConditionFlowStep,
  value: SemanticValue | undefined,
  values: ReturnType<typeof useConditionFlow>['state']['semanticValues'],
  onChange: (value: SemanticValue) => void,
  onFieldChange: (field: ConditionStepField, value: SemanticValue) => void,
) {
  if (step.kind === 'field_group') {
    return <FieldGroupStep fields={step.fields ?? []} values={values} onFieldChange={onFieldChange} />;
  }

  if (step.kind === 'single_select_cards') {
    return <SingleSelectCardsStep step={step} value={value} onChange={onChange} />;
  }

  if (step.kind === 'multi_select_cards') {
    return <MultiSelectCardsStep step={step} value={value} onChange={onChange} />;
  }

  if (step.kind === 'grouped_toggle_list') {
    return <GroupedToggleListStep step={step} value={value} onChange={onChange} />;
  }

  if (step.kind === 'year_picker') {
    return <YearPickerStep step={step} value={value} onChange={onChange} />;
  }

  if (step.kind === 'chip_select') {
    return <ChipSelectStep step={step} value={value} onChange={onChange} />;
  }

  return <InfoInterstitialStep step={step} value={value} onChange={onChange} />;
}

function isRequiredValueMissing(
  step: ConditionFlowStep,
  value: SemanticValue | undefined,
  values: ReturnType<typeof useConditionFlow>['state']['semanticValues'],
) {
  if (step.fields) {
    return step.fields.some((field) => {
      const fieldValue = values[field.semanticKey];
      return (
        field.required &&
        (fieldValue === undefined ||
          fieldValue === null ||
          fieldValue === '' ||
          (Array.isArray(fieldValue) && fieldValue.length === 0))
      );
    });
  }

  if (!step.required) {
    return false;
  }

  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
});
