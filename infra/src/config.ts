import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
const gcpConfig = new pulumi.Config('gcp');

export const project = gcpConfig.require('project');
export const region = config.get('region') ?? gcpConfig.get('region') ?? 'us-central1';
export const environment = config.get('environment') ?? pulumi.getStack();

export const names = {
  prefix: `led-${environment}`,
  artifactRepositoryId: config.get('artifactRepositoryId') ?? 'live-every-day',
  apiServiceName: config.get('apiServiceName') ?? 'live-every-day-api',
  migrationJobName: config.get('migrationJobName') ?? 'live-every-day-migrations',
  firebaseSiteId: config.get('firebaseSiteId') ?? project,
};

export const image = {
  api: config.get('apiImage') ?? 'us-docker.pkg.dev/cloudrun/container/hello',
  ignoreChanges: config.getBoolean('ignoreImageChanges') ?? true,
};

export const web = {
  url: config.get('webUrl') ?? `https://${names.firebaseSiteId}.web.app`,
};

/** Comma-separated browser origins allowed for CORS and Better Auth. */
export const corsOrigins =
  config.get('corsOrigins') ??
  config.get('webUrl') ??
  `https://${names.firebaseSiteId}.web.app`;

export const auth = {
  url: config.get('betterAuthUrl'),
  googleClientId: config.get('googleClientId'),
  googleClientSecretVersion: config.get('googleClientSecretVersion') ?? 'latest',
  githubClientId: config.get('githubClientId'),
  githubClientSecretVersion: config.get('githubClientSecretVersion') ?? 'latest',
};

export const database = {
  name: config.get('dbName') ?? 'live_every_day',
  user: config.get('dbUser') ?? 'led_app',
  tier: config.get('dbTier') ?? 'db-f1-micro',
  deletionProtection: config.getBoolean('dbDeletionProtection') ?? false,
};

export const cloudRun = {
  dbPoolMax: String(config.getNumber('dbPoolMax') ?? 5),
  minInstances: config.getNumber('cloudRunMinInstances') ?? 0,
  maxInstances: config.getNumber('cloudRunMaxInstances') ?? 5,
  cpu: String(config.getNumber('cloudRunCpu') ?? 1),
  memory: config.get('cloudRunMemory') ?? '512Mi',
  concurrency: config.getNumber('cloudRunConcurrency') ?? 80,
  timeout: config.get('cloudRunTimeout') ?? '30s',
  migrationTimeout: config.get('migrationTimeout') ?? '600s',
};

export const github = {
  repository: config.get('githubRepository'),
};
