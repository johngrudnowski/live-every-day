import { Global, Module } from '@nestjs/common';
import { createDbClient } from 'database/client';
import { DB_CLIENT } from './database.constants';

const defaultDatabaseUrl = 'postgresql://postgres:postgres@localhost:5432/live_every_day';

@Global()
@Module({
  providers: [
    {
      provide: DB_CLIENT,
      useFactory: () => createDbClient(process.env.DATABASE_URL ?? defaultDatabaseUrl),
    },
  ],
  exports: [DB_CLIENT],
})
export class DatabaseModule {}
