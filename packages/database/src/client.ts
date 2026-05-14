import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type PostgresOptions = NonNullable<Parameters<typeof postgres>[1]>;

const trueValues = new Set(['1', 'true', 'yes', 'on', 'require']);
const falseValues = new Set(['0', 'false', 'no', 'off']);

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function resolveSslConfig(): PostgresOptions['ssl'] {
  const sslEnabled = trueValues.has((process.env.DB_SSL ?? '').toLowerCase());
  if (!sslEnabled) {
    return undefined;
  }

  const rejectUnauthorized = !falseValues.has(
    (process.env.DB_SSL_REJECT_UNAUTHORIZED ?? 'true').toLowerCase(),
  );

  return { rejectUnauthorized };
}

export function createPostgresClient(databaseUrl = readRequiredEnv('DATABASE_URL')) {
  const parsedPoolMax = Number.parseInt(process.env.DB_POOL_MAX ?? '10', 10);

  return postgres(databaseUrl, {
    max: Number.isNaN(parsedPoolMax) ? 10 : parsedPoolMax,
    ssl: resolveSslConfig(),
  });
}

export function createDbClient(databaseUrl?: string) {
  const client = createPostgresClient(databaseUrl);
  return drizzle(client, { schema });
}

declare global {
  // eslint-disable-next-line no-var
  var __liveEveryDaySql: ReturnType<typeof createPostgresClient> | undefined;
  // eslint-disable-next-line no-var
  var __liveEveryDayDb: ReturnType<typeof createDbClient> | undefined;
}

export function getSqlClient() {
  globalThis.__liveEveryDaySql ??= createPostgresClient();
  return globalThis.__liveEveryDaySql;
}

export function getDbClient() {
  globalThis.__liveEveryDayDb ??= drizzle(getSqlClient(), { schema });
  return globalThis.__liveEveryDayDb;
}

export type DbClient = ReturnType<typeof createDbClient>;
