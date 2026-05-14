import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AppScreen, LedText, PrimaryButton, colors, radii, spacing } from '@led/design-system';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import {
  useSubmitWeeklyCheckinMutation,
  useWeeklyCheckinSummaryQuery,
  type WeeklyCheckin,
  type WeeklyCheckinSummary,
} from '../api/weekly-checkin-queries';
import { ThisWeeksScore } from './ThisWeeksScore';

export function WeeklyCheckinSavedScreen() {
  const params = useLocalSearchParams<{ justCompleted?: string }>();
  const summaryQuery = useWeeklyCheckinSummaryQuery();
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

  return (
    <SavedCheckinContent checkin={checkin} isJustCompleted={isJustCompleted} summary={summary} />
  );
}

function SavedCheckinContent({
  checkin,
  isJustCompleted,
  summary,
}: {
  checkin: WeeklyCheckin;
  isJustCompleted: boolean;
  summary: WeeklyCheckinSummary;
}) {
  const submitMutation = useSubmitWeeklyCheckinMutation();
  const [customNote, setCustomNote] = useState(checkin.customNote ?? '');
  const persistedNoteRef = useRef(checkin.customNote ?? '');

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

        <ThisWeeksScore
          checkin={checkin}
          previousCheckin={summary.previousWeekCheckin}
          history={summary.recentSubmittedCheckins ?? []}
        />

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
