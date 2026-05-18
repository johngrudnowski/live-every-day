import { resolve } from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import { createPostgresClient } from './client';
import * as schema from './schema';

const migrationsFolder = resolve(__dirname, '../drizzle');

async function runMigrations() {
  const sql = createPostgresClient();
  const db = drizzle(sql, { schema });

  try {
    console.log(`Running database migrations from ${migrationsFolder}`);
    await migrate(db, { migrationsFolder });
    console.log('Database migrations completed.');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

runMigrations().catch((error: unknown) => {
  console.error('Database migrations failed.');
  console.error(error);
  process.exitCode = 1;
});
