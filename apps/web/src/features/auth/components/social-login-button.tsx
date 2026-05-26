import { Button } from '@mantine/core';
import type { OAuthProvider } from '../hooks/use-auth-session';

type ProviderLabelMap = Record<OAuthProvider, string>;

const providerLabel: ProviderLabelMap = {
  github: 'Continue with GitHub',
  google: 'Continue with Google',
};

type SocialLoginButtonProps = {
  provider: OAuthProvider;
  isLoading: boolean;
  disabled?: boolean;
  onClick: (provider: OAuthProvider) => Promise<void>;
};

export function SocialLoginButton({
  provider,
  isLoading,
  disabled = false,
  onClick,
}: SocialLoginButtonProps) {
  return (
    <Button
      fullWidth
      variant="default"
      loading={isLoading}
      disabled={disabled}
      onClick={() => void onClick(provider)}
    >
      {providerLabel[provider]}
    </Button>
  );
}
