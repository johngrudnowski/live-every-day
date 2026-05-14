import { authClient } from '../lib/auth-client';

export type OAuthProvider = 'google' | 'github';

type AuthErrorResult = {
  error?: {
    message?: string;
  };
};

export function useAuthSession() {
  const sessionState = authClient.useSession();

  const signInWithProvider = async (provider: OAuthProvider) => {
    const callbackURL = window.location.origin;

    const result = (await authClient.signIn.social({
      provider,
      callbackURL,
    })) as AuthErrorResult | undefined;

    if (result?.error) {
      throw new Error(result.error.message ?? 'Unable to start sign in.');
    }
  };

  const signOut = async () => {
    const result = (await authClient.signOut()) as AuthErrorResult | undefined;

    if (result?.error) {
      throw new Error(result.error.message ?? 'Unable to sign out.');
    }
  };

  return {
    ...sessionState,
    signInWithProvider,
    signOut,
  };
}
