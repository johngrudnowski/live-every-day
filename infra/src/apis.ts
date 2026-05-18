import * as gcp from '@pulumi/gcp';
import { project } from './config';

const requiredApis = [
  'artifactregistry.googleapis.com',
  'run.googleapis.com',
  'sqladmin.googleapis.com',
  'secretmanager.googleapis.com',
  'iam.googleapis.com',
  'iamcredentials.googleapis.com',
  'cloudresourcemanager.googleapis.com',
  'serviceusage.googleapis.com',
  'compute.googleapis.com',
  'servicenetworking.googleapis.com',
  'firebase.googleapis.com',
  'firebasehosting.googleapis.com',
  'monitoring.googleapis.com',
  'logging.googleapis.com',
] as const;

export const enabledServices = requiredApis.map(
  (service) =>
    new gcp.projects.Service(`api-${service.replace(/[.]/g, '-')}`, {
      project,
      service,
      disableOnDestroy: false,
    }),
);

export const serviceDependencies = { dependsOn: enabledServices };
