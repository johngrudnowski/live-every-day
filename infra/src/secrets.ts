import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import * as random from '@pulumi/random';
import { apiRuntimeAccount, migrationRuntimeAccount } from './iam';
import { names, project } from './config';
import { serviceDependencies } from './apis';

function createSecret(name: string, secretId: string) {
  return new gcp.secretmanager.Secret(
    name,
    {
      project,
      secretId,
      replication: {
        auto: {},
      },
    },
    serviceDependencies,
  );
}

export const dbPassword = new random.RandomPassword('db-password', {
  length: 32,
  special: true,
});

export const betterAuthSecretValue = new random.RandomPassword('better-auth-secret-value', {
  length: 48,
  special: false,
});

export const databaseUrlSecret = createSecret('database-url-secret', `${names.prefix}-database-url`);
export const betterAuthSecret = createSecret('better-auth-secret', `${names.prefix}-better-auth-secret`);
export const googleClientSecret = createSecret('google-client-secret', `${names.prefix}-google-client-secret`);
export const githubClientSecret = createSecret('github-client-secret', `${names.prefix}-github-client-secret`);

export const betterAuthSecretVersion = new gcp.secretmanager.SecretVersion('better-auth-secret-version', {
  secret: betterAuthSecret.id,
  secretData: betterAuthSecretValue.result,
});

export function createDatabaseUrlSecretVersion(databaseUrl: pulumi.Input<string>) {
  return new gcp.secretmanager.SecretVersion('database-url-secret-version', {
    secret: databaseUrlSecret.id,
    secretData: databaseUrl,
  });
}

const runtimeSecretAccess = [
  { name: 'api-database-url-access', secret: databaseUrlSecret, account: apiRuntimeAccount },
  { name: 'api-better-auth-secret-access', secret: betterAuthSecret, account: apiRuntimeAccount },
  { name: 'api-google-client-secret-access', secret: googleClientSecret, account: apiRuntimeAccount },
  { name: 'api-github-client-secret-access', secret: githubClientSecret, account: apiRuntimeAccount },
  { name: 'migration-database-url-access', secret: databaseUrlSecret, account: migrationRuntimeAccount },
  { name: 'migration-better-auth-secret-access', secret: betterAuthSecret, account: migrationRuntimeAccount },
] as const;

export const runtimeSecretBindings = runtimeSecretAccess.map(
  ({ name, secret, account }) =>
    new gcp.secretmanager.SecretIamMember(name, {
      project,
      secretId: secret.secretId,
      role: 'roles/secretmanager.secretAccessor',
      member: pulumi.interpolate`serviceAccount:${account.email}`,
    }),
);
