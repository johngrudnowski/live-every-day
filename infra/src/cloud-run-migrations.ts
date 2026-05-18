import * as gcp from '@pulumi/gcp';
import { migrationRuntimeAccount } from './iam';
import { cloudRun, image, names, project, region } from './config';
import { databaseUrlSecretVersion, instance } from './cloud-sql';
import { runtimeSecretBindings } from './secrets';
import { migrationEnv, vpcAccess } from './cloud-run-common';

export const job = new gcp.cloudrunv2.Job(
  'migration-job',
  {
    project,
    location: region,
    name: names.migrationJobName,
    deletionProtection: false,
    template: {
      taskCount: 1,
      parallelism: 1,
      template: {
        serviceAccount: migrationRuntimeAccount.email,
        timeout: cloudRun.migrationTimeout,
        maxRetries: 0,
        vpcAccess,
        containers: [
          {
            image: image.api,
            commands: ['node'],
            args: ['packages/database/dist/migrate.js'],
            envs: [
              ...migrationEnv,
              { name: 'DATABASE_URL_SECRET_VERSION', value: databaseUrlSecretVersion.version },
            ],
            resources: {
              limits: {
                cpu: cloudRun.cpu,
                memory: cloudRun.memory,
              },
            },
          },
        ],
      },
    },
  },
  {
    dependsOn: [instance, databaseUrlSecretVersion, ...runtimeSecretBindings],
    ignoreChanges: image.ignoreChanges ? ['template.template.containers[0].image'] : [],
  },
);
