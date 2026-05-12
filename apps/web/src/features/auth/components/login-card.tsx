import { Alert, Button, Paper, Stack, Text, Title } from '@mantine/core';
import type { OAuthProvider } from '../hooks/use-auth-session';
import { SocialLoginButton } from './social-login-button';

type LoginCardProps = {
  isAuthenticated: boolean;
  isSessionLoading: boolean;
  isActionLoading: boolean;
  errorMessage: string | null;
  userEmail?: string;
  onSignIn: (provider: OAuthProvider) => Promise<void>;
  onSignOut: () => Promise<void>;
};

export function LoginCard({
  isAuthenticated,
  isSessionLoading,
  isActionLoading,
  errorMessage,
  userEmail,
  onSignIn,
  onSignOut,
}: LoginCardProps) {
  return (
    <Paper withBorder radius="md" p="xl" maw={460} w="100%">
      <Stack gap="md">
        <Title order={2}>Live Every Day</Title>
        <Text c="dimmed">Sign in to continue.</Text>

        {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}

        {isAuthenticated ? (
          <Stack gap="xs">
            <Text>You are signed in{userEmail ? ` as ${userEmail}` : ''}.</Text>
            <Button loading={isActionLoading} onClick={() => void onSignOut()}>
              Sign out
            </Button>
          </Stack>
        ) : (
          <Stack gap="sm">
            <SocialLoginButton
              provider="google"
              isLoading={isActionLoading}
              disabled={isSessionLoading}
              onClick={onSignIn}
            />
            <SocialLoginButton
              provider="github"
              isLoading={isActionLoading}
              disabled={isSessionLoading}
              onClick={onSignIn}
            />
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
