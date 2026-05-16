#!/usr/bin/env node
import { loadSeedEnv } from './database-url';
import { parseSeedOptions, UsageError } from './options';
import { runSeed } from './run-seed';

async function main() {
  loadSeedEnv();
  const options = parseSeedOptions();
  const result = await runSeed(options);

  console.log(`Seed target: ${result.plan.databaseUrl}`);
  console.log(`Seed user: ${result.plan.email}`);
  console.log(`Seed modules: ${result.plan.modules.join(', ')}`);

  if (result.dryRun) {
    console.log('Dry run complete. No data was written.');
    return;
  }

  for (const moduleResult of result.results) {
    console.log(`- ${moduleResult.module}: ${moduleResult.detail}`);
  }
}

main().catch((error: unknown) => {
  if (error instanceof UsageError) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error(`Seed failed: ${message}`);
  process.exitCode = 1;
});
