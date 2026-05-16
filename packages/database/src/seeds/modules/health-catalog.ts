import { healthDataSourceCatalog, healthMetricCatalog } from '../../health-catalog';
import { healthDataSources, healthMetricTypes } from '../../schema';
import type { SeedContext } from '../types';

export async function seedHealthCatalog(ctx: SeedContext) {
  await ctx.db
    .insert(healthDataSources)
    .values(healthDataSourceCatalog.map((source) => ({ ...source, updatedAt: ctx.now })))
    .onConflictDoNothing();

  await ctx.db
    .insert(healthMetricTypes)
    .values(healthMetricCatalog.map((metric) => ({ ...metric, updatedAt: ctx.now })))
    .onConflictDoNothing();
}
