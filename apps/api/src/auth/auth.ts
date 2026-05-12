import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { DbClient } from 'database/client';

const defaultBaseUrl = 'http://localhost:3000';
const defaultDevSecret = 'dev-only-change-this-secret-to-32-plus-chars';

function parseCsvEnv(name: string): string[] {
  return (process.env[name] ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function resolveAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('BETTER_AUTH_SECRET is required in production.');
  }

  return defaultDevSecret;
}

function buildSocialProviders(): BetterAuthOptions['socialProviders'] {
  const providers: Record<string, { clientId: string; clientSecret: string }> = {};

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (googleClientId && googleClientSecret) {
    providers.google = { clientId: googleClientId, clientSecret: googleClientSecret };
  }

  const githubClientId = process.env.GITHUB_CLIENT_ID;
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (githubClientId && githubClientSecret) {
    providers.github = { clientId: githubClientId, clientSecret: githubClientSecret };
  }

  return Object.keys(providers).length > 0
    ? (providers as BetterAuthOptions['socialProviders'])
    : undefined;
}

export function createAuth(db: DbClient) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
    }),
    baseURL: process.env.BETTER_AUTH_URL ?? defaultBaseUrl,
    basePath: '/auth',
    secret: resolveAuthSecret(),
    trustedOrigins: parseCsvEnv('BETTER_AUTH_TRUSTED_ORIGINS'),
    socialProviders: buildSocialProviders(),
    emailAndPassword: {
      enabled: false,
    },
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
