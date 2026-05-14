import { router } from 'expo-router';
import * as Linking from 'expo-linking';
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
    const callbackURL = resolveCallbackUrl('/home');
    const result = (await authClient.signIn.social({
      provider: 'google',
      callbackURL,
    })) as AuthErrorResult | undefined;

    if (result?.error) {
      throw new Error(result.error.message ?? 'Unable to start Google sign in.');
    }
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

  return Linking.createURL(path);
}
