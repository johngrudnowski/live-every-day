import { router, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { AppScreen, LedText, PrimaryButton, spacing } from '@led/design-system';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <AppScreen style={styles.container}>
        <LedText variant="title">This screen doesn't exist.</LedText>
        <PrimaryButton label="Go home" onPress={() => router.replace('/')} />
      </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
});
