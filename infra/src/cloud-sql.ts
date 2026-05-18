import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { database, names, project, region } from './config';
import { privateServiceConnection, network } from './network';
import { dbPassword, createDatabaseUrlSecretVersion } from './secrets';

export const instance = new gcp.sql.DatabaseInstance(
  'postgres-instance',
  {
    project,
    name: `${names.prefix}-postgres`,
    region,
    databaseVersion: 'POSTGRES_16',
    deletionProtection: database.deletionProtection,
    settings: {
      tier: database.tier,
      edition: 'ENTERPRISE',
      availabilityType: 'ZONAL',
      diskType: 'PD_SSD',
      diskAutoresize: true,
      backupConfiguration: {
        enabled: true,
        pointInTimeRecoveryEnabled: false,
        startTime: '04:00',
      },
      insightsConfig: {
        queryInsightsEnabled: true,
      },
      ipConfiguration: {
        ipv4Enabled: false,
        privateNetwork: network.selfLink,
      },
      maintenanceWindow: {
        day: 7,
        hour: 5,
        updateTrack: 'stable',
      },
    },
  },
  { dependsOn: [privateServiceConnection] },
);

export const appDatabase = new gcp.sql.Database('app-database', {
  project,
  instance: instance.name,
  name: database.name,
});

export const appUser = new gcp.sql.User('app-database-user', {
  project,
  instance: instance.name,
  name: database.user,
  password: dbPassword.result,
});

const privateIpAddress = instance.privateIpAddress;

export const databaseUrl = pulumi
  .all([dbPassword.result, privateIpAddress])
  .apply(([password, host]) => `postgresql://${database.user}:${encodeURIComponent(password)}@${host}:5432/${database.name}`);

export const databaseUrlSecretVersion = createDatabaseUrlSecretVersion(databaseUrl);
