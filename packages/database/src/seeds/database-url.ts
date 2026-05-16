import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
const defaultDatabaseUrl = 'postgresql://postgres:postgres@localhost:5432/live_every_day';

export function loadSeedEnv() {
  loadEnv({ path: resolve(process.cwd(), '../../.env'), quiet: true });
  loadEnv({ path: resolve(process.cwd(), '.env'), quiet: true });
}

export function resolveSeedDatabaseUrl(cliDatabaseUrl?: string) {
  return cliDatabaseUrl ?? process.env.DATABASE_URL ?? defaultDatabaseUrl;
}

export function assertSafeDatabaseTarget(databaseUrl: string, allowRemote: boolean) {
  if (allowRemote || isLocalDatabaseUrl(databaseUrl)) {
    return;
  }

  const host = readDatabaseHost(databaseUrl);
  throw new Error(
    `Refusing to seed non-local database host "${host}". Pass --allow-remote if this is intentional.`,
  );
}

export function redactDatabaseUrl(databaseUrl: string) {
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    return databaseUrl;
  }
}

function isLocalDatabaseUrl(databaseUrl: string) {
  return localHosts.has(readDatabaseHost(databaseUrl));
}

function readDatabaseHost(databaseUrl: string) {
  try {
    return new URL(databaseUrl).hostname;
  } catch {
    throw new Error('DATABASE_URL must be a valid database URL.');
  }
}
