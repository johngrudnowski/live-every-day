import * as gcp from '@pulumi/gcp';
import { names, project } from './config';
import { serviceDependencies } from './apis';

export const firebaseProject = new gcp.firebase.Project(
  'firebase-project',
  {
    project,
  },
  serviceDependencies,
);

export const hostingSite = new gcp.firebase.HostingSite(
  'firebase-hosting-site',
  {
    project,
    siteId: names.firebaseSiteId,
  },
  { dependsOn: [firebaseProject] },
);
