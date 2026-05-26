import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppScreen, LedText, colors, spacing } from '@led/design-system';
import { ScreenHeaderChevronLink, ScreenHeaderNavRow } from '@/components/screen-header';
import { ScreenFooter, screenFooterNavActiveLabel } from '@/components/screen-footer';
import { HomeVitalsSection } from './HomeVitalsSection';
import { LabValuesSection } from './LabValuesSection';
import { SymptomTrendSection } from './SymptomTrendSection';
import { WearablesSection } from './WearablesSection';

export function OurDataScreen() {
  return (
    <AppScreen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <ScreenHeaderNavRow
          left={<ScreenHeaderChevronLink label="Home" onPress={() => router.replace('/home')} />}
          title={
            <LedText variant="subtitle" numberOfLines={1} ellipsizeMode="tail">
              Our Data
            </LedText>
          }
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LabValuesSection />
        <SymptomTrendSection />
        <WearablesSection />
        <HomeVitalsSection />
      </ScrollView>

      <ScreenFooter activeLabel={screenFooterNavActiveLabel.data} />
    </AppScreen>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
