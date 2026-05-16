import { and, eq } from 'drizzle-orm';
import { createHash, randomUUID } from 'node:crypto';
import { healthObservationGroups, healthObservations, healthSourceConnections } from '../../schema';
import type { SeedContext, SeedResult, SeedUserTarget } from '../types';
import { seedHealthCatalog } from './health-catalog';

export type SeedVitalsOptions = {
  readings: number;
  days: number;
};

const seedSourceId = 'seed';

export async function seedVitals(
  ctx: SeedContext,
  target: SeedUserTarget,
  options: SeedVitalsOptions,
): Promise<SeedResult> {
  await seedHealthCatalog(ctx);
  const sourceConnectionId = await getOrCreateSeedSourceConnection(ctx, target);

  await ctx.db
    .delete(healthObservations)
    .where(
      and(
        eq(healthObservations.userId, target.userId),
        eq(healthObservations.sourceConnectionId, sourceConnectionId),
      ),
    );
  await ctx.db
    .delete(healthObservationGroups)
    .where(
      and(
        eq(healthObservationGroups.userId, target.userId),
        eq(healthObservationGroups.sourceConnectionId, sourceConnectionId),
      ),
    );

  const groups = buildVitalReadingGroups(ctx, target, sourceConnectionId, options);
  const observations = groups.flatMap((group) => group.observations);

  if (groups.length > 0) {
    await ctx.db
      .insert(healthObservationGroups)
      .values(groups.map(({ observations: _observations, ...group }) => group));
  }

  if (observations.length > 0) {
    await ctx.db.insert(healthObservations).values(observations);
  }

  return {
    module: 'vitals',
    count: groups.length,
    detail: `seeded ${groups.length} vital readings across ${options.days} days`,
  };
}

async function getOrCreateSeedSourceConnection(ctx: SeedContext, target: SeedUserTarget) {
  const [existing] = await ctx.db
    .select({ id: healthSourceConnections.id })
    .from(healthSourceConnections)
    .where(
      and(
        eq(healthSourceConnections.userId, target.userId),
        eq(healthSourceConnections.sourceId, seedSourceId),
        eq(healthSourceConnections.status, 'connected'),
      ),
    )
    .limit(1);

  if (existing) {
    return existing.id;
  }

  const [created] = await ctx.db
    .insert(healthSourceConnections)
    .values({
      id: randomUUID(),
      userId: target.userId,
      sourceId: seedSourceId,
      displayName: 'Seed data',
      status: 'connected',
      updatedAt: ctx.now,
    })
    .returning({ id: healthSourceConnections.id });

  return created.id;
}

function buildVitalReadingGroups(
  ctx: SeedContext,
  target: SeedUserTarget,
  sourceConnectionId: string,
  options: SeedVitalsOptions,
) {
  const intervalDays = Math.max(options.days - 1, 1) / Math.max(options.readings - 1, 1);

  return Array.from({ length: options.readings }, (_, index) => {
    const observedAt = new Date(ctx.now);
    observedAt.setUTCHours(14, 0, 0, 0);
    observedAt.setUTCDate(observedAt.getUTCDate() - Math.round(index * intervalDays));

    const groupId = createSeedVitalGroupId(target.userId, observedAt);
    const pressureCycle = index % 9;
    const pulseCycle = index % 7;
    const temperatureCycle = index % 6;
    const oxygenCycle = index % 8;

    const values = [
      {
        metricKey: 'blood_pressure_systolic',
        valueNumeric: 116 + pressureCycle * 3,
        unit: 'mmHg',
      },
      {
        metricKey: 'blood_pressure_diastolic',
        valueNumeric: 72 + Math.floor(pressureCycle * 1.5),
        unit: 'mmHg',
      },
      {
        metricKey: 'heart_rate',
        valueNumeric: 64 + pulseCycle * 4,
        unit: 'bpm',
      },
      {
        metricKey: 'body_temperature',
        valueNumeric: Math.round((97.6 + temperatureCycle / 10) * 10) / 10,
        unit: 'degF',
      },
      {
        metricKey: 'oxygen_saturation',
        valueNumeric: 98 - (oxygenCycle === 0 ? 2 : oxygenCycle % 2),
        unit: '%',
      },
    ];

    return {
      id: groupId,
      userId: target.userId,
      groupType: 'seed_vital_reading',
      sourceConnectionId,
      sourceRecordId: groupId,
      observedAt,
      updatedAt: ctx.now,
      observations: values.map((value) => ({
        id: createSeedVitalObservationId(target.userId, observedAt, value.metricKey),
        userId: target.userId,
        metricKey: value.metricKey,
        sourceConnectionId,
        observationGroupId: groupId,
        sourceRecordId: `${groupId}:${value.metricKey}`,
        valueNumeric: value.valueNumeric,
        unit: value.unit,
        observedAt,
        recordedAt: observedAt,
        aggregationKind: 'point',
        updatedAt: ctx.now,
      })),
    };
  });
}

function createSeedVitalGroupId(userId: string, observedAt: Date) {
  const digest = createHash('sha256')
    .update(`${userId}:${observedAt.toISOString()}:vital-group`)
    .digest('hex')
    .slice(0, 24);
  return `seed_vital_group_${digest}`;
}

function createSeedVitalObservationId(userId: string, observedAt: Date, metricKey: string) {
  const digest = createHash('sha256')
    .update(`${userId}:${observedAt.toISOString()}:${metricKey}:vital`)
    .digest('hex')
    .slice(0, 24);
  return `seed_vital_${digest}`;
}
