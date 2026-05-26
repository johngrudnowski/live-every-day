import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  AppScreen,
  LedText,
  LogoMark,
  PrimaryButton,
  Wordmark,
  colors,
  radii,
  spacing,
} from '@led/design-system';

import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import { useMobileAuth } from '../hooks/use-mobile-auth';

type AuthMode = 'register' | 'login';

type AuthScreenProps = {
  mode: AuthMode;
};

const copyByMode = {
  register: {
    title: 'Create your account',
    subtitle: 'Use Google to keep your health timeline connected across devices.',
    button: 'Continue with Google',
    switchLabel: 'I already have an account',
    switchRoute: '/auth/login',
  },
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in with Google to continue.',
    button: 'Sign in with Google',
    switchLabel: 'Create an account',
    switchRoute: '/auth/register',
  },
} as const;

export function AuthScreen({ mode }: AuthScreenProps) {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data, isPending, signInWithGoogle } = useMobileAuth();
  const copy = copyByMode[mode];

  const isAuthenticated = useMemo(() => Boolean(data?.session), [data?.session]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/home');
    }
  }, [isAuthenticated]);

  const handleGoogleAuth = async () => {
    try {
      setErrorMessage(null);
      setIsActionLoading(true);
      await signInWithGoogle();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to continue with Google.';
      setErrorMessage(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isPending && !data) {
    return <LoadingScreen message="Checking your session" />;
  }

  return (
    <AppScreen scroll contentContainerStyle={styles.content}>
      <View style={styles.brand}>
        <LogoMark size={74} />
        <Wordmark size="medium" />
      </View>

      <View style={styles.card}>
        <LedText variant="displayMedium" align="center">
          {copy.title}
        </LedText>
        <LedText variant="body" color="textMid" align="center">
          {copy.subtitle}
        </LedText>

        {errorMessage ? (
          <View style={styles.error}>
            <LedText variant="bodySmall" color="flagHigh">
              {errorMessage}
            </LedText>
          </View>
        ) : null}

        <PrimaryButton
          label={isActionLoading ? 'Opening Google...' : copy.button}
          disabled={isActionLoading}
          fullWidth
          onPress={handleGoogleAuth}
        />
        <PrimaryButton
          label={copy.switchLabel}
          variant="secondary"
          disabled={isActionLoading}
          fullWidth
          onPress={() => router.replace(copy.switchRoute)}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.md,
  },
  card: {
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.xl,
  },
  error: {
    borderRadius: radii.lg,
    backgroundColor: colors.flagHighBg,
    padding: spacing.md,
  },
});
