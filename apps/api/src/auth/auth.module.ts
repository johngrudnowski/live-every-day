import { Global, Module } from '@nestjs/common';
import type { DbClient } from 'database/client';
import { DB_CLIENT } from '../database/database.constants';
import { createAuth } from './auth';
import { AuthController } from './auth.controller';
import { AUTH_INSTANCE } from './auth.constants';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_INSTANCE,
      inject: [DB_CLIENT],
      useFactory: (db: DbClient) => createAuth(db),
    },
  ],
  exports: [AUTH_INSTANCE],
})
export class AuthModule {}
