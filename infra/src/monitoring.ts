import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { monitoringConfig, project } from './config';
import { service } from './cloud-run-api';
import { job } from './cloud-run-migrations';
import { instance } from './cloud-sql';

function alertPolicy(
  name: string,
  displayName: string,
  filter: pulumi.Input<string>,
  thresholdValue: number,
  duration: string,
  perSeriesAligner = 'ALIGN_RATE',
) {
  return new gcp.monitoring.AlertPolicy(name, {
    project,
    displayName,
    combiner: 'OR',
    enabled: true,
    conditions: [
      {
        displayName,
        conditionThreshold: {
          filter,
          duration,
          comparison: 'COMPARISON_GT',
          thresholdValue,
          aggregations: [
            {
              alignmentPeriod: '60s',
              perSeriesAligner,
            },
          ],
        },
      },
    ],
  });
}

export const apiFiveHundredAlert = alertPolicy(
  'api-5xx-alert',
  'Live Every Day API 5xx responses',
  pulumi.interpolate`resource.type = "cloud_run_revision" AND resource.labels.service_name = "${service.name}" AND metric.type = "run.googleapis.com/request_count" AND metric.labels.response_code_class = "5xx"`,
  0,
  '60s',
);

export const migrationFailureAlert = alertPolicy(
  'migration-failure-alert',
  'Live Every Day migration job failures',
  pulumi.interpolate`resource.type = "cloud_run_job" AND resource.labels.job_name = "${job.name}" AND metric.type = "run.googleapis.com/job/completed_task_attempt_count" AND metric.labels.result = "failed"`,
  0,
  '60s',
);

export const cloudSqlCpuAlert = alertPolicy(
  'cloudsql-cpu-alert',
  'Live Every Day Cloud SQL high CPU',
  pulumi.interpolate`resource.type = "cloudsql_database" AND resource.labels.database_id = "${project}:${instance.name}" AND metric.type = "cloudsql.googleapis.com/database/cpu/utilization"`,
  0.8,
  '300s',
  'ALIGN_MEAN',
);

export let uptimeCheck: gcp.monitoring.UptimeCheckConfig | undefined;

if (monitoringConfig.uptimeCheckEnabled) {
  uptimeCheck = new gcp.monitoring.UptimeCheckConfig('api-health-uptime-check', {
    project,
    displayName: 'Live Every Day API health',
    timeout: '10s',
    period: '60s',
    httpCheck: {
      path: '/api/health',
      port: 443,
      useSsl: true,
    },
    monitoredResource: {
      type: 'uptime_url',
      labels: {
        project_id: project,
        host: service.uri.apply((uri) => new URL(uri).host),
      },
    },
  });
}

type MonitoringResourceNames = {
  apiFiveHundredAlert: pulumi.Output<string>;
  migrationFailureAlert: pulumi.Output<string>;
  cloudSqlCpuAlert: pulumi.Output<string>;
  uptimeCheck?: pulumi.Output<string>;
};

export const monitoringResourceNames: MonitoringResourceNames = {
  apiFiveHundredAlert: apiFiveHundredAlert.name,
  migrationFailureAlert: migrationFailureAlert.name,
  cloudSqlCpuAlert: cloudSqlCpuAlert.name,
  ...(uptimeCheck ? { uptimeCheck: uptimeCheck.name } : {}),
};
