import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { apiRuntimeAccount } from './iam';
import { cloudRun, image, names, project, region } from './config';
import { databaseUrlSecretVersion, instance } from './cloud-sql';
import { runtimeSecretBindings } from './secrets';
import { servicePlainEnv, serviceSecretEnv, vpcAccess } from './cloud-run-common';

export const service = new gcp.cloudrunv2.Service(
  'api-service',
  {
    project,
    location: region,
    name: names.apiServiceName,
    ingress: 'INGRESS_TRAFFIC_ALL',
    deletionProtection: false,
    template: {
      serviceAccount: apiRuntimeAccount.email,
      timeout: cloudRun.timeout,
      maxInstanceRequestConcurrency: cloudRun.concurrency,
      scaling: {
        minInstanceCount: cloudRun.minInstances,
        maxInstanceCount: cloudRun.maxInstances,
      },
      vpcAccess,
      containers: [
        {
          image: image.api,
          ports: { containerPort: 3000 },
          envs: [
            ...servicePlainEnv,
            { name: 'DATABASE_URL_SECRET_VERSION', value: databaseUrlSecretVersion.version },
            ...serviceSecretEnv,
          ],
          resources: {
            limits: {
              cpu: cloudRun.cpu,
              memory: cloudRun.memory,
            },
          },
          startupProbe: {
            initialDelaySeconds: 5,
            timeoutSeconds: 5,
            periodSeconds: 10,
            failureThreshold: 6,
            httpGet: {
              path: '/api/health',
              port: 3000,
            },
          },
        },
      ],
    },
  },
  {
    dependsOn: [instance, databaseUrlSecretVersion, ...runtimeSecretBindings],
    ignoreChanges: image.ignoreChanges ? ['template.containers[0].image'] : [],
  },
);

export const publicInvoker = new gcp.cloudrunv2.ServiceIamMember('api-public-invoker', {
  project,
  location: region,
  name: service.name,
  role: 'roles/run.invoker',
  member: 'allUsers',
});

const serviceUrl = service.uri;

export const apiUrl = pulumi.output(serviceUrl);
