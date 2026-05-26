import './apis';
import './network';
import './iam';
import './secrets';
import './cloud-sql';
import './cloud-run-migrations';
import './monitoring';
import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { repositoryUrl } from './artifact-registry';
import { apiUrl } from './cloud-run-api';
import { hostingSite } from './firebase-hosting';
import { names, project, region, web } from './config';
import { instance } from './cloud-sql';
import { job } from './cloud-run-migrations';
import { githubDeployAccount, githubIdentityPool } from './iam';

const gcpProjectDetails = gcp.organizations.getProjectOutput({ projectId: project });

export const gcpProject = project;
export const gcpProjectNumber = gcpProjectDetails.number;
export const gcpRegion = region;
export const artifactRepositoryUrl = repositoryUrl;
export const apiServiceUrl = apiUrl;
export const migrationJobName = job.name;
export const cloudSqlInstanceName = instance.name;
export const firebaseHostingSiteId = hostingSite.siteId;
export const firebaseWebUrl = web.url;
export const apiImageName = `${repositoryUrl}/api`;
export const apiServiceName = names.apiServiceName;
export const githubDeployServiceAccountEmail = githubDeployAccount.email;
export const githubWorkloadIdentityProvider = githubIdentityPool
  ? pulumi.interpolate`projects/${gcpProjectDetails.number}/locations/global/workloadIdentityPools/${githubIdentityPool.workloadIdentityPoolId}/providers/github`
  : undefined;
