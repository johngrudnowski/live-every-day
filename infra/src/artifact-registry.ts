import * as gcp from '@pulumi/gcp';
import { names, project, region } from './config';
import { serviceDependencies } from './apis';

export const repository = new gcp.artifactregistry.Repository(
  'api-images',
  {
    project,
    location: region,
    repositoryId: names.artifactRepositoryId,
    description: 'Live Every Day container images',
    format: 'DOCKER',
    cleanupPolicies: [
      {
        id: 'delete-old-untagged',
        action: 'DELETE',
        condition: {
          tagState: 'UNTAGGED',
          olderThan: '1209600s',
        },
      },
      {
        id: 'keep-recent-tagged',
        action: 'KEEP',
        mostRecentVersions: {
          keepCount: 30,
        },
      },
    ],
  },
  serviceDependencies,
);

export const repositoryUrl = `${region}-docker.pkg.dev/${project}/${names.artifactRepositoryId}`;
