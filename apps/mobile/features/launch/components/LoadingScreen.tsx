import { StyleSheet, View } from 'react-native';
import { AppScreen, LedText, Wordmark, spacing } from '@led/design-system';
import { AnimatedLogoMark } from './AnimatedLogoMark';

type LoadingScreenProps = {
  message?: string;
};

export function LoadingScreen({ message = 'Loading Live Every Day' }: LoadingScreenProps) {
  return (
    <AppScreen surface="canvas" style={styles.screen}>
      <View style={styles.brand}>
        <AnimatedLogoMark size={82} />
        <Wordmark size="medium" />
      </View>
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
