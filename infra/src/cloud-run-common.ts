import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { cloudRun, corsOrigins } from './config';
import {
  betterAuthSecret,
  databaseUrlSecret,
  githubClientSecret,
  googleClientSecret,
} from './secrets';
import { network, serverlessSubnet } from './network';
import { auth } from './config';

type EnvVar = gcp.types.input.cloudrunv2.ServiceTemplateContainerEnv;
type JobEnvVar = gcp.types.input.cloudrunv2.JobTemplateTemplateContainerEnv;

function secretEnv(name: string, secret: gcp.secretmanager.Secret): EnvVar {
  return {
    name,
    valueSource: {
      secretKeyRef: {
        secret: secret.secretId,
        version: 'latest',
      },
    },
  };
}

function jobSecretEnv(name: string, secret: gcp.secretmanager.Secret): JobEnvVar {
  return {
    name,
    valueSource: {
      secretKeyRef: {
        secret: secret.secretId,
        version: 'latest',
      },
    },
  };
}

export const servicePlainEnv: EnvVar[] = [
  { name: 'NODE_ENV', value: 'production' },
  { name: 'DB_POOL_MAX', value: cloudRun.dbPoolMax },
  { name: 'CORS_ORIGIN', value: corsOrigins },
  { name: 'BETTER_AUTH_TRUSTED_ORIGINS', value: corsOrigins },
]
  .concat(auth.url ? [{ name: 'BETTER_AUTH_URL', value: auth.url }] : [])
  .concat(auth.googleClientId ? [{ name: 'GOOGLE_CLIENT_ID', value: auth.googleClientId }] : [])
  .concat(
    auth.googleClientId
      ? [{ name: 'GOOGLE_CLIENT_SECRET_VERSION', value: auth.googleClientSecretVersion }]
      : [],
  )
  .concat(auth.githubClientId ? [{ name: 'GITHUB_CLIENT_ID', value: auth.githubClientId }] : [])
  .concat(
    auth.githubClientId
      ? [{ name: 'GITHUB_CLIENT_SECRET_VERSION', value: auth.githubClientSecretVersion }]
      : [],
  );

export const serviceSecretEnv: EnvVar[] = [
  secretEnv('DATABASE_URL', databaseUrlSecret),
  secretEnv('BETTER_AUTH_SECRET', betterAuthSecret),
]
  .concat(auth.googleClientId ? [secretEnv('GOOGLE_CLIENT_SECRET', googleClientSecret)] : [])
  .concat(auth.githubClientId ? [secretEnv('GITHUB_CLIENT_SECRET', githubClientSecret)] : []);

export const migrationEnv: JobEnvVar[] = [
  { name: 'NODE_ENV', value: 'production' },
  { name: 'DB_POOL_MAX', value: '1' },
  jobSecretEnv('DATABASE_URL', databaseUrlSecret),
  jobSecretEnv('BETTER_AUTH_SECRET', betterAuthSecret),
];

export const vpcAccess = {
  egress: 'PRIVATE_RANGES_ONLY',
  networkInterfaces: [
    {
      network: network.name,
      subnetwork: serverlessSubnet.name,
    },
  ],
};

export function withApiUrl(env: EnvVar[], apiUrl: pulumi.Output<string>): EnvVar[] {
  return env.map((entry) =>
    entry.name === 'BETTER_AUTH_URL'
      ? {
          ...entry,
          value: apiUrl,
        }
      : entry,
  );
}
