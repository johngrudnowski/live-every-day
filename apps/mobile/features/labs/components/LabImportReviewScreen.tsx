import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppScreen,
  LedText,
  PrimaryButton,
  colors,
  radii,
  spacing,
} from '@led/design-system';
import {
  ScreenHeaderChevronLink,
  ScreenHeaderNavRow,
} from '@/components/screen-header';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import { LabImportField } from './LabImportFields';
import {
  useAcceptHealthImportCandidatesMutation,
  useHealthImportQuery,
  useRejectHealthImportCandidatesMutation,
  useUpdateHealthImportCandidateMutation,
  type HealthImportCandidate,
} from '../api/health-import-queries';
import { cbcLabMetrics, getLabMetricLabel } from '../lib/labMetrics';

type CandidateForm = {
  rawLabel: string;
  rawValue: string;
  rawUnit: string;
  rawReferenceRange: string;
  abnormalFlag: string;
  normalizedMetricKey: string | null;
};

export function LabImportReviewScreen() {
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const importQuery = useHealthImportQuery(jobId);
  const updateMutation = useUpdateHealthImportCandidateMutation();
  const acceptMutation = useAcceptHealthImportCandidatesMutation();
  const rejectMutation = useRejectHealthImportCandidatesMutation();
  const candidates = importQuery.data?.candidates ?? [];
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (candidates.length === 0 || selectedIds.size > 0) {
      return;
    }

    setSelectedIds(
      new Set(
        candidates
          .filter(
            (candidate) =>
              candidate.status === 'candidate' && !hasErrorIssue(candidate),
          )
          .map((candidate) => candidate.id),
      ),
    );
  }, [candidates, selectedIds.size]);

  const selectedCount = selectedIds.size;
  const isPending =
    updateMutation.isPending ||
    acceptMutation.isPending ||
    rejectMutation.isPending;

  if (importQuery.isPending) {
    return <LoadingScreen message="Loading lab import" />;
  }

  if (!jobId || !importQuery.data) {
    return (
      <ReviewShell title="Review labs">
        <View style={styles.card}>
          <LedText variant="subtitle">Import not found</LedText>
          <PrimaryButton
            label="Back to data"
            fullWidth
            onPress={() => router.replace('/data')}
          />
        </View>
      </ReviewShell>
    );
  }

  function toggleSelected(candidateId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(candidateId)) {
        next.delete(candidateId);
      } else {
        next.add(candidateId);
      }
      return next;
    });
  }

  function importSelected() {
    if (!jobId || selectedIds.size === 0) {
      Alert.alert('Select rows', 'Choose at least one row to import.');
      return;
    }

    acceptMutation.mutate(
      {
        jobId,
        data: { candidateIds: [...selectedIds] },
      },
      {
        onSuccess: () => router.replace(`/labs/import/${jobId}/result`),
        onError: (error) =>
          Alert.alert('Unable to import labs', getErrorMessage(error)),
      },
    );
  }

  return (
    <ReviewShell title="Review labs">
      <View style={styles.summaryCard}>
        <LedText variant="subtitle">
          {importQuery.data.job.sourceLabel ?? 'Manual lab entry'}
        </LedText>
        <LedText variant="bodySmall" color="predawn">
          {formatDate(importQuery.data.job.observedAt)} ·{' '}
          {importQuery.data.job.status}
        </LedText>
      </View>

      {candidates.length === 0 ? (
        <View style={styles.card}>
          <LedText variant="subtitle">No lab rows found</LedText>
          <PrimaryButton
            label="Add rows"
            fullWidth
            onPress={() => router.replace('/labs/import')}
          />
        </View>
      ) : (
        candidates.map((candidate) => (
          <CandidateReviewCard
            key={candidate.id}
            candidate={candidate}
            disabled={isPending}
            isSelected={selectedIds.has(candidate.id)}
            jobId={jobId}
            onReject={() => {
              rejectMutation.mutate(
                { jobId, data: { candidateIds: [candidate.id] } },
                {
                  onSuccess: () => {
                    setSelectedIds((current) => {
                      const next = new Set(current);
                      next.delete(candidate.id);
                      return next;
                    });
                  },
                  onError: (error) =>
                    Alert.alert('Unable to reject row', getErrorMessage(error)),
                },
              );
            }}
            onSave={(form) => {
              updateMutation.mutate(
                {
                  jobId,
                  candidateId: candidate.id,
                  data: {
                    rawLabel: form.rawLabel,
                    rawValue: form.rawValue,
                    rawUnit: form.rawUnit || null,
                    rawReferenceRange: form.rawReferenceRange || null,
                    abnormalFlag: form.abnormalFlag || null,
                    normalizedMetricKey: form.normalizedMetricKey,
                    status: 'candidate',
                  },
                },
                {
                  onError: (error) =>
                    Alert.alert('Unable to save row', getErrorMessage(error)),
                },
              );
            }}
            onToggleSelected={() => toggleSelected(candidate.id)}
          />
        ))
      )}

      <View style={styles.actions}>
        <PrimaryButton
          label={
            acceptMutation.isPending
              ? 'Importing...'
              : `Import ${selectedCount} selected`
          }
          fullWidth
          disabled={isPending || selectedCount === 0}
          onPress={importSelected}
        />
        <PrimaryButton
          label="Back to data"
          variant="secondary"
          fullWidth
          disabled={isPending}
          onPress={() => router.replace('/data')}
        />
      </View>
    </ReviewShell>
  );
}

function ReviewShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <AppScreen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <ScreenHeaderNavRow
          left={
            <ScreenHeaderChevronLink
              label="Labs"
              onPress={() => router.replace('/labs/import')}
            />
          }
          title={<LedText variant="subtitle">{title}</LedText>}
        />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </AppScreen>
  );
}

function CandidateReviewCard({
  candidate,
  disabled,
  isSelected,
  jobId,
  onReject,
  onSave,
  onToggleSelected,
}: {
  candidate: HealthImportCandidate;
  disabled: boolean;
  isSelected: boolean;
  jobId: string;
  onReject: () => void;
  onSave: (form: CandidateForm) => void;
  onToggleSelected: () => void;
}) {
  const initialForm = useMemo(() => formFromCandidate(candidate), [candidate]);
  const [form, setForm] = useState(initialForm);
  const canSelect =
    candidate.status === 'candidate' && !hasErrorIssue(candidate);
  const hasChanges = !haveSameForm(form, initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  return (
    <View
      style={[
        styles.card,
        candidate.status === 'rejected' && styles.rejectedCard,
      ]}
    >
      <View style={styles.candidateHeader}>
        <View style={styles.candidateTitle}>
          <LedText variant="subtitle">{candidate.rawLabel}</LedText>
          <LedText variant="bodySmall" color="predawn">
            {getLabMetricLabel(candidate.normalizedMetricKey)}
          </LedText>
        </View>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isSelected, disabled: !canSelect }}
          disabled={!canSelect || disabled}
          style={[
            styles.selectButton,
            isSelected && styles.selectedButton,
            !canSelect && styles.disabledButton,
          ]}
          onPress={onToggleSelected}
        >
          <FontAwesome
            name={isSelected ? 'check' : 'plus'}
            size={14}
            color={colors.midnight}
          />
        </Pressable>
      </View>

      <View style={styles.valueRow}>
        <LedText style={styles.valueText}>
          {candidate.normalizedValueNumeric ?? candidate.rawValue}
        </LedText>
        <LedText variant="bodySmall" color="predawn">
          {candidate.normalizedUnit ?? candidate.rawUnit ?? ''}
        </LedText>
        <StatusPill status={candidate.status} flag={candidate.abnormalFlag} />
      </View>

      {candidate.issues.length > 0 ? (
        <View style={styles.issues}>
          {candidate.issues.map((issue) => (
            <LedText
              key={`${candidate.id}-${issue.code}`}
              variant="bodySmall"
              color={issue.severity === 'error' ? 'flagHigh' : 'predawn'}
            >
              {issue.message}
            </LedText>
          ))}
        </View>
      ) : null}

      <View style={styles.metricChips}>
        {cbcLabMetrics.map((metric) => (
          <Pressable
            key={`${jobId}-${candidate.id}-${metric.key}`}
            accessibilityRole="button"
            disabled={disabled || candidate.status === 'committed'}
            style={[
              styles.metricChip,
              form.normalizedMetricKey === metric.key &&
                styles.metricChipSelected,
            ]}
            onPress={() =>
              setForm((current) => ({
                ...current,
                normalizedMetricKey: metric.key,
              }))
            }
          >
            <LedText variant="bodySmall">{metric.label}</LedText>
          </Pressable>
        ))}
      </View>

      <LabImportField
        label="Label"
        value={form.rawLabel}
        placeholder="Platelets"
        autoCapitalize="words"
        onChangeText={(rawLabel) =>
          setForm((current) => ({ ...current, rawLabel }))
        }
      />
      <View style={styles.twoColumn}>
        <LabImportField
          label="Value"
          value={form.rawValue}
          placeholder="842"
          style={styles.columnField}
          keyboardType="decimal-pad"
          autoCapitalize="none"
          onChangeText={(rawValue) =>
            setForm((current) => ({ ...current, rawValue }))
          }
        />
        <LabImportField
          label="Unit"
          value={form.rawUnit}
          placeholder="x10^3/uL"
          style={styles.columnField}
          autoCapitalize="none"
          onChangeText={(rawUnit) =>
            setForm((current) => ({ ...current, rawUnit }))
          }
        />
      </View>
      <View style={styles.twoColumn}>
        <LabImportField
          label="Range"
          value={form.rawReferenceRange}
          placeholder="150-450"
          style={styles.columnField}
          autoCapitalize="none"
          onChangeText={(rawReferenceRange) =>
            setForm((current) => ({ ...current, rawReferenceRange }))
          }
        />
        <LabImportField
          label="Flag"
          value={form.abnormalFlag}
          placeholder="normal"
          style={styles.columnField}
          autoCapitalize="none"
          onChangeText={(abnormalFlag) =>
            setForm((current) => ({ ...current, abnormalFlag }))
          }
        />
      </View>

      <View style={styles.cardActions}>
        <PrimaryButton
          label="Save row"
          variant="secondary"
          disabled={disabled || !hasChanges || candidate.status === 'committed'}
          onPress={() => onSave(form)}
        />
        <PrimaryButton
          label="Reject"
          variant="danger"
          disabled={
            disabled ||
            candidate.status === 'committed' ||
            candidate.status === 'rejected'
          }
          onPress={onReject}
        />
      </View>
    </View>
  );
}

function StatusPill({
  status,
  flag,
}: {
  status: string;
  flag: string | null | undefined;
}) {
  const label = status === 'candidate' ? (flag ?? 'review') : status;
  return (
    <View style={[styles.pill, flag === 'high' && styles.highPill]}>
      <LedText
        variant="bodySmall"
        style={[styles.pillText, flag === 'high' && styles.highText]}
      >
        {label}
      </LedText>
    </View>
  );
}

function formFromCandidate(candidate: HealthImportCandidate): CandidateForm {
  return {
    rawLabel: candidate.rawLabel,
    rawValue: candidate.rawValue,
    rawUnit: candidate.rawUnit ?? '',
    rawReferenceRange: candidate.rawReferenceRange ?? '',
    abnormalFlag: candidate.abnormalFlag ?? '',
    normalizedMetricKey: candidate.normalizedMetricKey ?? null,
  };
}

function haveSameForm(left: CandidateForm, right: CandidateForm) {
  return (
    left.rawLabel === right.rawLabel &&
    left.rawValue === right.rawValue &&
    left.rawUnit === right.rawUnit &&
    left.rawReferenceRange === right.rawReferenceRange &&
    left.abnormalFlag === right.abnormalFlag &&
    left.normalizedMetricKey === right.normalizedMetricKey
  );
}

function hasErrorIssue(candidate: HealthImportCandidate) {
  return candidate.issues.some((issue) => issue.severity === 'error');
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'No date';
  }

  return new Date(value).toLocaleDateString();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  summaryCard: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  card: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  rejectedCard: {
    opacity: 0.68,
  },
  candidateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  candidateTitle: {
    flex: 1,
    gap: spacing.xxs,
  },
  selectButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  selectedButton: {
    borderColor: colors.midday,
    backgroundColor: colors.selectedBg,
  },
  disabledButton: {
    opacity: 0.4,
  },
  valueRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  valueText: {
    color: colors.midnight,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 22,
    lineHeight: 26,
  },
  pill: {
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  highPill: {
    backgroundColor: colors.flagHighBg,
  },
  pillText: {
    color: colors.predawn,
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    lineHeight: 13,
  },
  highText: {
    color: colors.flagHigh,
  },
  issues: {
    gap: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: radii.lg,
    backgroundColor: colors.canvas,
    padding: spacing.md,
  },
  metricChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  metricChipSelected: {
    borderColor: colors.midday,
    backgroundColor: colors.selectedBg,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  columnField: {
    flex: 1,
    minWidth: 0,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
});
