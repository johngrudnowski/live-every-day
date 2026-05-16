import { drizzle } from 'drizzle-orm/postgres-js';
import { createPostgresClient } from '../client';
import * as schema from '../schema';
import {
  assertSafeDatabaseTarget,
  redactDatabaseUrl,
  resolveSeedDatabaseUrl,
} from './database-url';
import { seedCircle } from './modules/circle';
import { seedConditions } from './modules/conditions';
import { seedUser } from './modules/users';
import { seedVitals } from './modules/vitals';
import { seedWeeklyCheckins } from './modules/weekly-checkins';
import type { SeedOptions } from './options';
import type { SeedContext, SeedResult } from './types';

export async function runSeed(options: SeedOptions) {
  const databaseUrl = resolveSeedDatabaseUrl(options.databaseUrl);
  assertSafeDatabaseTarget(databaseUrl, options.allowRemote);

  const plan = describeSeedPlan(options, databaseUrl);
  if (options.dryRun) {
    return {
      databaseUrl,
      plan,
      results: [] satisfies SeedResult[],
      dryRun: true,
    };
  }

  const sql = createPostgresClient(databaseUrl);
  const db = drizzle(sql, { schema });

  try {
    const ctx: SeedContext = {
      db,
      now: new Date(),
    };
    const target = await seedUser(ctx, options.email);
    const results: SeedResult[] = [];

    if (options.modules.circle) {
      results.push(await seedCircle(ctx, target));
    }

    if (options.modules.conditions) {
      results.push(await seedConditions(ctx, target, options.conditions));
    }

    if (options.modules.weeklyCheckins) {
      results.push(await seedWeeklyCheckins(ctx, target, options.weeklyCheckins));
    }

    if (options.modules.vitals) {
      results.push(await seedVitals(ctx, target, options.vitals));
    }

    return {
      databaseUrl,
      plan,
      user: target,
      results,
      dryRun: false,
    };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

function describeSeedPlan(options: SeedOptions, databaseUrl: string) {
  const modules: string[] = [];

  if (options.modules.conditions) {
    modules.push(`conditions(${options.conditions.conditionIds.join(',')})`);
  }

  if (options.modules.circle) {
    modules.push('circle');
  }

  if (options.modules.weeklyCheckins) {
    modules.push(`weekly-checkins(${options.weeklyCheckins.weeks} weeks)`);
  }

  if (options.modules.vitals) {
    modules.push(`vitals(${options.vitals.readings} readings/${options.vitals.days} days)`);
  }

  return {
    email: options.email,
    databaseUrl: redactDatabaseUrl(databaseUrl),
    modules,
  };
}
