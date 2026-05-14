import { Global, Module } from '@nestjs/common';
import type { DbClient } from 'database/client';
import { DB_CLIENT } from '../database/database.constants';
import { createAuth } from './auth';
import { AuthController } from './auth.controller';
import { AUTH_INSTANCE } from './auth.constants';
import { AuthSessionService } from './auth-session.service';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_INSTANCE,
      inject: [DB_CLIENT],
      useFactory: (db: DbClient) => createAuth(db),
    },
    AuthSessionService,
  ],
  exports: [AUTH_INSTANCE, AuthSessionService],
})
export class AuthModule {}
