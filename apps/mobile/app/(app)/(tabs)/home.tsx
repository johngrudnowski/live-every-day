import { StyleSheet, View } from 'react-native';
import { AppScreen, LedText, PrimaryButton, colors, radii, spacing } from '@led/design-system';

import { useMobileAuth } from '@/features/auth/hooks/use-mobile-auth';

export default function TabOneScreen() {
  const { data, signOut } = useMobileAuth();
  const userEmail = data?.user?.email;

  return (
    <AppScreen style={styles.screen}>
      <View style={styles.card}>
        <LedText variant="displayMedium">Today is ready when you are.</LedText>
        <LedText variant="body" color="textMid">
          {userEmail ? `Signed in as ${userEmail}.` : 'You are signed in.'}
        </LedText>
        <PrimaryButton label="Sign out" variant="secondary" onPress={() => void signOut()} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  card: {
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.xl,
  },
});
