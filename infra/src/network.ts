import * as gcp from '@pulumi/gcp';
import { names, project, region } from './config';
import { serviceDependencies } from './apis';

export const network = new gcp.compute.Network(
  'app-network',
  {
    project,
    name: `${names.prefix}-network`,
    autoCreateSubnetworks: false,
  },
  serviceDependencies,
);

export const serverlessSubnet = new gcp.compute.Subnetwork(
  'serverless-subnet',
  {
    project,
    region,
    name: `${names.prefix}-serverless`,
    ipCidrRange: '10.20.0.0/24',
    network: network.id,
  },
  { dependsOn: [network] },
);

const privateServiceRange = new gcp.compute.GlobalAddress(
  'private-service-range',
  {
    project,
    name: `${names.prefix}-private-services`,
    purpose: 'VPC_PEERING',
    addressType: 'INTERNAL',
    prefixLength: 16,
    network: network.id,
  },
  { dependsOn: [network] },
);

export const privateServiceConnection = new gcp.servicenetworking.Connection(
  'private-service-connection',
  {
    network: network.id,
    service: 'servicenetworking.googleapis.com',
    reservedPeeringRanges: [privateServiceRange.name],
  },
  { dependsOn: [privateServiceRange] },
);
