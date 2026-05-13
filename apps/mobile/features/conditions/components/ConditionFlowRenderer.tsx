import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppScreen, LedText, PrimaryButton, colors, radii, spacing } from '@led/design-system';
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
  initialStepId?: string;
  initialValues?: Record<string, SemanticValue>;
  mode?: 'onboarding' | 'account';
};

export function ConditionFlowRenderer({
  conditionId,
  initialStepId,
  initialValues,
  mode = 'onboarding',
}: ConditionFlowRendererProps) {
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
          actions={
            <PrimaryButton
              label="Back to conditions"
              onPress={() => router.replace('/conditions')}
            />
          }
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

  return (
    <ActiveConditionFlow
      conditionDefinition={definitionQuery.data}
      initialStepId={initialStepId}
      initialValues={initialValues}
      mode={mode}
    />
  );
}

function ActiveConditionFlow({
  conditionDefinition,
  initialStepId,
  initialValues,
  mode,
}: {
  conditionDefinition: NonNullable<ReturnType<typeof useConditionDefinitionQuery>['data']>;
  initialStepId?: string;
  initialValues?: Record<string, SemanticValue>;
  mode: 'onboarding' | 'account';
}) {
  const flow = useConditionFlow(conditionDefinition, {
    initialStepId,
    initialValues,
    includeLinkedSteps: mode === 'account',
  });
  const saveMutation = useSaveConditionProfileMutation();
  const skipMutation = useSkipConditionOnboardingMutation();
  const currentStep = flow.currentStep;
  const [linkedReturnStepId, setLinkedReturnStepId] = useState<string | null>(null);
  const isAccountMode = mode === 'account';

  async function handleSkip() {
    if (currentStep) {
      await saveProfileDraft(currentStep.id);
    }

    await skipMutation.mutateAsync();
    router.replace('/home');
  }

  async function saveProfileDraft(currentStepId: string) {
    if (!currentStep) {
      return;
    }

    await saveMutation.mutateAsync({
      conditionId: conditionDefinition.id,
      conditionDefinitionVersion: conditionDefinition.version,
      values: getValuesWithDefaults(flow.state.semanticValues, currentStep),
      complete: false,
      currentStepId,
    });
  }

  async function handleContinue() {
    if (!currentStep) {
      return;
    }

    const values = getValuesWithDefaults(flow.state.semanticValues, currentStep);
    flow.seedDefaultValue(currentStep);

    if (isAccountMode) {
      await saveMutation.mutateAsync({
        conditionId: conditionDefinition.id,
        conditionDefinitionVersion: conditionDefinition.version,
        values,
        complete: true,
        currentStepId: currentStep.id,
      });
      router.replace('/account');
      return;
    }

    if (currentStep.includeInOnboarding === false && linkedReturnStepId) {
      await saveProfileDraft(linkedReturnStepId);
      flow.goToStep(linkedReturnStepId);
      setLinkedReturnStepId(null);
      return;
    }

    if (!flow.isLastStep) {
      const nextStep = flow.visibleSteps[flow.currentIndex + 1];
      await saveMutation.mutateAsync({
        conditionId: conditionDefinition.id,
        conditionDefinitionVersion: conditionDefinition.version,
        values,
        complete: false,
        currentStepId: nextStep?.id ?? currentStep.id,
      });
      flow.goNext();
      return;
    }

    await saveMutation.mutateAsync({
      conditionId: conditionDefinition.id,
      conditionDefinitionVersion: conditionDefinition.version,
      values,
      complete: true,
      currentStepId: currentStep.id,
    });
    router.replace('/home');
  }

  if (!currentStep) {
    return <ComingSoonScreen condition={conditionDefinition} />;
  }

  const currentValue = currentStep.semanticKey
    ? flow.state.semanticValues[currentStep.semanticKey]
    : undefined;
  const continueDisabled =
    isRequiredValueMissing(currentStep, currentValue, flow.state.semanticValues) ||
    saveMutation.isPending;

  return (
    <AppScreen padded={false} style={styles.screen}>
      <ConditionFlowHeader
        title={isAccountMode ? 'Health profile' : 'About your diagnosis'}
        progressValue={Math.max(1, flow.currentIndex + 2)}
        progressMax={flow.visibleSteps.length + 1}
        onBack={() => {
          if (isAccountMode) {
            router.replace('/account');
            return;
          }

          if (currentStep.includeInOnboarding === false && linkedReturnStepId) {
            flow.goToStep(linkedReturnStepId);
            setLinkedReturnStepId(null);
            return;
          }

          if (flow.isFirstStep) {
            router.replace('/conditions');
            return;
          }

          flow.goBack();
        }}
        onSkip={isAccountMode ? undefined : () => void handleSkip()}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ConditionStepScaffold
          eyebrow={currentStep.eyebrow}
          title={currentStep.title}
          subtitle={currentStep.subtitle}
          actions={
            <PrimaryButton
              label={isAccountMode ? 'Save' : flow.isLastStep ? 'Save and continue' : 'Continue'}
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
            (stepId) => {
              setLinkedReturnStepId(currentStep.id);
              flow.goToStep(stepId);
            },
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
  onLinkedStepPress: (stepId: string) => void,
) {
  const renderedStep = (() => {
    if (step.kind === 'field_group') {
      return (
        <FieldGroupStep fields={step.fields ?? []} values={values} onFieldChange={onFieldChange} />
      );
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
  })();

  if (!step.linkedSteps?.length) {
    return renderedStep;
  }

  return (
    <View style={styles.stepWithLinks}>
      {renderedStep}
      <View style={styles.linkList}>
        {step.linkedSteps.map((linkedStep) => (
          <Pressable
            key={linkedStep.stepId}
            accessibilityRole="button"
            onPress={() => onLinkedStepPress(linkedStep.stepId)}
            style={({ pressed }) => [styles.linkCard, pressed && styles.pressed]}
          >
            <View style={styles.linkCopy}>
              <LedText variant="subtitle">{linkedStep.label}</LedText>
              {linkedStep.description ? (
                <LedText variant="bodySmall" color="textMid">
                  {linkedStep.description}
                </LedText>
              ) : null}
            </View>
            <LedText variant="title" color="midday">
              ›
            </LedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
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

  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function getValuesWithDefaults(
  values: ReturnType<typeof useConditionFlow>['state']['semanticValues'],
  step: ConditionFlowStep,
) {
  const nextValues = { ...values } as Record<string, SemanticValue>;

  for (const field of step.fields ?? []) {
    if (nextValues[field.semanticKey] === undefined && field.defaultValue !== undefined) {
      nextValues[field.semanticKey] = field.defaultValue;
    }
  }

  if (
    step.semanticKey &&
    nextValues[step.semanticKey] === undefined &&
    step.defaultValue !== undefined
  ) {
    nextValues[step.semanticKey] = step.defaultValue;
  }

  return nextValues;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  stepWithLinks: {
    gap: spacing.lg,
  },
  linkList: {
    gap: spacing.md,
  },
  linkCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  linkCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  pressed: {
    opacity: 0.72,
  },
});
