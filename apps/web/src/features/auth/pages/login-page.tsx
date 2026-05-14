import { Center, Loader } from '@mantine/core';
import { useMemo, useState } from 'react';
import { LoginCard } from '../components/login-card';
import { useAuthSession, type OAuthProvider } from '../hooks/use-auth-session';

export function LoginPage() {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data, isPending, signInWithProvider, signOut } = useAuthSession();

  const isAuthenticated = useMemo(() => Boolean(data?.session), [data?.session]);
  const userEmail = useMemo(() => data?.user?.email ?? undefined, [data?.user?.email]);

  const handleSignIn = async (provider: OAuthProvider) => {
    try {
      setErrorMessage(null);
      setIsActionLoading(true);
      await signInWithProvider(provider);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to sign in.';
      setErrorMessage(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setErrorMessage(null);
      setIsActionLoading(true);
      await signOut();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to sign out.';
      setErrorMessage(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isPending && !data) {
    return (
      <Center mih="100vh">
        <Loader />
      </Center>
    );
  }

  return (
    <Center mih="100vh" px="md">
      <LoginCard
        isAuthenticated={isAuthenticated}
        isSessionLoading={isPending}
        isActionLoading={isActionLoading}
        errorMessage={errorMessage}
        userEmail={userEmail}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />
    </Center>
  );
}
