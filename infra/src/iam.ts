import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { github, names, project } from './config';
import { serviceDependencies } from './apis';

export const apiRuntimeAccount = new gcp.serviceaccount.Account(
  'api-runtime-account',
  {
    project,
    accountId: `${names.prefix}-api-runtime`,
    displayName: 'Live Every Day API runtime',
  },
  serviceDependencies,
);

export const migrationRuntimeAccount = new gcp.serviceaccount.Account(
  'migration-runtime-account',
  {
    project,
    accountId: `${names.prefix}-migration-runtime`,
    displayName: 'Live Every Day migration runtime',
  },
  serviceDependencies,
);

export const githubDeployAccount = new gcp.serviceaccount.Account(
  'github-deploy-account',
  {
    project,
    accountId: `${names.prefix}-github-deploy`,
    displayName: 'Live Every Day GitHub deploy',
  },
  serviceDependencies,
);

const deployRoles = [
  'roles/artifactregistry.admin',
  'roles/run.admin',
  'roles/firebase.admin',
  'roles/firebasehosting.admin',
  'roles/cloudsql.admin',
  'roles/secretmanager.admin',
  'roles/iam.serviceAccountAdmin',
  'roles/iam.workloadIdentityPoolAdmin',
  'roles/iam.serviceAccountUser',
  'roles/resourcemanager.projectIamAdmin',
  'roles/serviceusage.serviceUsageAdmin',
  'roles/compute.networkAdmin',
  'roles/servicenetworking.networksAdmin',
  'roles/monitoring.editor',
  'roles/logging.configWriter',
] as const;

export const githubDeployRoleBindings = deployRoles.map(
  (role) =>
    new gcp.projects.IAMMember(`github-deploy-${role.split('/').pop()}`, {
      project,
      role,
      member: pulumi.interpolate`serviceAccount:${githubDeployAccount.email}`,
    }),
);

export const apiCloudSqlClient = new gcp.projects.IAMMember('api-cloudsql-client', {
  project,
  role: 'roles/cloudsql.client',
  member: pulumi.interpolate`serviceAccount:${apiRuntimeAccount.email}`,
});

export const migrationCloudSqlClient = new gcp.projects.IAMMember('migration-cloudsql-client', {
  project,
  role: 'roles/cloudsql.client',
  member: pulumi.interpolate`serviceAccount:${migrationRuntimeAccount.email}`,
});

export const githubIdentityPool = github.repository
  ? new gcp.iam.WorkloadIdentityPool(
      'github-identity-pool',
      {
        project,
        workloadIdentityPoolId: `${names.prefix}-github`,
        displayName: 'GitHub Actions',
      },
      serviceDependencies,
    )
  : undefined;

export const githubIdentityProvider =
  github.repository && githubIdentityPool
    ? new gcp.iam.WorkloadIdentityPoolProvider('github-identity-provider', {
        project,
        workloadIdentityPoolId: githubIdentityPool.workloadIdentityPoolId,
        workloadIdentityPoolProviderId: 'github',
        displayName: 'GitHub OIDC',
        attributeMapping: {
          'google.subject': 'assertion.sub',
          'attribute.actor': 'assertion.actor',
          'attribute.repository': 'assertion.repository',
          'attribute.ref': 'assertion.ref',
        },
        attributeCondition: `assertion.repository == "${github.repository}" && assertion.ref == "${github.deploymentRef}"`,
        oidc: {
          issuerUri: 'https://token.actions.githubusercontent.com',
        },
      })
    : undefined;

export const githubDeployWorkloadIdentityBinding =
  github.repository && githubIdentityPool
    ? new gcp.serviceaccount.IAMMember('github-deploy-workload-identity', {
        serviceAccountId: githubDeployAccount.name,
        role: 'roles/iam.workloadIdentityUser',
        member: pulumi.interpolate`principalSet://iam.googleapis.com/${githubIdentityPool.name}/attribute.repository/${github.repository}`,
      })
    : undefined;
