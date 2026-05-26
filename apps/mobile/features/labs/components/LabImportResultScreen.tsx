import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppScreen, LedText, PrimaryButton, colors, radii, spacing } from '@led/design-system';
import { ScreenHeaderChevronLink, ScreenHeaderNavRow } from '@/components/screen-header';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import { useHealthImportQuery } from '../api/health-import-queries';

export function LabImportResultScreen() {
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const importQuery = useHealthImportQuery(jobId);

  if (importQuery.isPending) {
    return <LoadingScreen message="Loading import result" />;
  }

  const candidates = importQuery.data?.candidates ?? [];
  const committedCount = candidates.filter((candidate) => candidate.status === 'committed').length;
  const rejectedCount = candidates.filter((candidate) => candidate.status === 'rejected').length;

  return (
    <AppScreen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <ScreenHeaderNavRow
          left={
            <ScreenHeaderChevronLink
              label="Review"
              onPress={() => router.replace(`/labs/import/${jobId}`)}
            />
          }
          title={<LedText variant="subtitle">Import complete</LedText>}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <LedText variant="displayMedium" style={styles.title}>
            Labs saved.
          </LedText>
          <LedText variant="body" color="textMid" style={styles.subtitle}>
            {committedCount} row{committedCount === 1 ? '' : 's'} were saved as observations.
          </LedText>
        </View>

        <View style={styles.stats}>
          <Stat label="Imported" value={committedCount} />
          <Stat label="Rejected" value={rejectedCount} />
          <Stat label="Status" value={importQuery.data?.job.status ?? 'unknown'} />
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="View Our Data" fullWidth onPress={() => router.replace('/data')} />
          <PrimaryButton
            label="Add another panel"
            variant="secondary"
            fullWidth
            onPress={() => router.replace('/labs/import')}
          />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.stat}>
      <LedText variant="bodySmall" color="predawn">
        {label}
      </LedText>
      <LedText variant="subtitle">{value}</LedText>
    </View>
  );
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
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  card: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  title: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    lineHeight: 21,
  },
  stats: {
    gap: spacing.sm,
  },
  stat: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
  },
});
