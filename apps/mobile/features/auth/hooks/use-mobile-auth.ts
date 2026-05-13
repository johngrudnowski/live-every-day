import { router } from 'expo-router';
import { Platform } from 'react-native';

import { authClient } from '../lib/auth-client';

type AuthErrorResult = {
  error?: {
    message?: string;
  };
};

export function useMobileAuth() {
  const sessionState = authClient.useSession();

  const signInWithGoogle = async () => {
    const result = (await authClient.signIn.social({
      provider: 'google',
      callbackURL: resolveCallbackUrl('/home'),
    })) as AuthErrorResult | undefined;

    if (result?.error) {
      throw new Error(result.error.message ?? 'Unable to start Google sign in.');
    }

    router.replace('/home');
  };

  const signOut = async () => {
    const result = (await authClient.signOut()) as AuthErrorResult | undefined;

    if (result?.error) {
      throw new Error(result.error.message ?? 'Unable to sign out.');
    }

    router.replace('/auth/login');
  };

  return {
    ...sessionState,
    signInWithGoogle,
    signOut,
  };
}

function resolveCallbackUrl(path: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return new URL(path, window.location.origin).toString();
  }

  return path;
}
