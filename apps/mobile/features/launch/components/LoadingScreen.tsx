import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppScreen, LedText, LogoMark, Wordmark, colors, spacing } from '@led/design-system';

type LoadingScreenProps = {
  message?: string;
};

export function LoadingScreen({ message = 'Loading Live Every Day' }: LoadingScreenProps) {
  return (
    <AppScreen surface="canvas" style={styles.screen}>
      <View style={styles.brand}>
        <LogoMark size={74} />
        <Wordmark size="medium" />
      </View>
      <ActivityIndicator color={colors.midday} />
      <LedText variant="bodySmall" color="textMid" align="center">
        {message}
      </LedText>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.md,
  },
});
