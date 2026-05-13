import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AppScreen, LedText, PrimaryButton, colors, radii, spacing } from '@led/design-system';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import {
  useSubmitWeeklyCheckinMutation,
  useWeeklyCheckinSummaryQuery,
} from '../api/weekly-checkin-queries';

export function WeeklyCheckinSavedScreen() {
  const params = useLocalSearchParams<{ justCompleted?: string }>();
  const summaryQuery = useWeeklyCheckinSummaryQuery();
  const submitMutation = useSubmitWeeklyCheckinMutation();
  const summary = summaryQuery.data;
  const checkin =
    summary?.currentCheckin?.status === 'submitted'
      ? summary.currentCheckin
      : summary?.lastSubmittedCheckin;

  if (summaryQuery.isPending) {
    return <LoadingScreen message="Loading saved check-in" />;
  }

  if (!summary || !checkin) {
    return <LoadingScreen message="No saved check-in yet" />;
  }

  const isJustCompleted = params.justCompleted === '1';
  const [customNote, setCustomNote] = useState(checkin.customNote ?? '');
  const persistedNoteRef = useRef(checkin.customNote ?? '');
  const previousScore = summary.previousWeekCheckin?.score.total;
  const scoreDelta = useMemo(
    () => (typeof previousScore === 'number' ? checkin.score.total - previousScore : null),
    [checkin.score.total, previousScore],
  );

  useEffect(() => {
    const incoming = checkin.customNote ?? '';
    setCustomNote(incoming);
    persistedNoteRef.current = incoming;
  }, [checkin.id, checkin.customNote]);

  useEffect(() => {
    if (customNote === persistedNoteRef.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      submitMutation.mutate(
        {
          data: {
            definitionId: summary.activeDefinition.id,
            definitionVersion: summary.activeDefinition.version,
            answers: checkin.answers,
            customNote,
          },
        },
        {
          onSuccess: () => {
            persistedNoteRef.current = customNote;
          },
        },
      );
    }, 700);

    return () => clearTimeout(timeoutId);
  }, [
    checkin.answers,
    customNote,
    submitMutation,
    summary.activeDefinition.id,
    summary.activeDefinition.version,
  ]);

  return (
    <AppScreen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <LedText variant="subtitle">Check-in complete</LedText>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {isJustCompleted ? (
            <View style={styles.checkMarkWrap}>
              <LedText style={styles.checkMark}>✓</LedText>
            </View>
          ) : null}
          <LedText variant="title">Check-in saved.</LedText>
          <LedText variant="bodySmall" color="predawn">
            Week of {formatDate(checkin.weekStartDate)}
          </LedText>
        </View>

        <View style={styles.scoreCard}>
          <LedText variant="label" color="predawn" style={styles.scoreLabel}>
            This week&apos;s score
          </LedText>
          <View style={styles.scoreTopRow}>
            <View>
              <LedText variant="displayMedium" style={styles.scoreValue}>
                {checkin.score.total}
              </LedText>
              {scoreDelta !== null ? (
                <LedText
                  variant="bodySmall"
                  style={scoreDelta >= 0 ? styles.scoreDeltaUp : styles.scoreDeltaDown}
                >
                  {scoreDelta >= 0 ? '↑' : '↓'} {Math.abs(scoreDelta)} from last week
                </LedText>
              ) : (
                <LedText variant="bodySmall" color="predawn">
                  out of {checkin.score.max}
                </LedText>
              )}
            </View>
          </View>
        </View>

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
              value={customNote}
              onChangeText={setCustomNote}
              placeholder="Type anything you want your brief to capture"
              placeholderTextColor={colors.textLite}
              style={styles.noteInput}
            />
            <LedText variant="bodySmall" color="midday">
              {submitMutation.isPending ? 'Saving...' : 'Saved to your brief ✓'}
            </LedText>
          </View>
        </View>

        <View style={styles.briefCard}>
          <LedText variant="subtitle" color="midday">
            Building your appt brief
          </LedText>
          <LedText variant="bodySmall" color="textMid">
            This check-in is now included in your next appointment summary.
          </LedText>
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="Back to home" fullWidth onPress={() => router.replace('/home')} />
          <PrimaryButton
            label="Brief ->"
            variant="secondary"
            fullWidth
            onPress={() => Alert.alert('Not yet implemented', 'Brief is not yet implemented.')}
          />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00Z`));
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  header: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  headerRow: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkMarkWrap: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.flagOkBg,
  },
  checkMark: {
    color: '#1A6040',
    fontSize: 28,
    lineHeight: 30,
  },
  scoreCard: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  scoreLabel: {
    alignSelf: 'stretch',
  },
  scoreTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  scoreValue: {
    color: colors.flagHigh,
    fontFamily: 'Raleway_300Light',
    fontSize: 48,
    lineHeight: 52,
  },
  scoreDeltaUp: {
    color: colors.flagHigh,
  },
  scoreDeltaDown: {
    color: colors.flagOk,
  },
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
  briefCard: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: '#C8E4F0',
    borderRadius: radii.xl,
    backgroundColor: colors.selectedBg,
    padding: spacing.md,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
