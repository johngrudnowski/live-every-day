import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountModule } from './account/account.module';
import { AuthModule } from './auth/auth.module';
import { ConditionsModule } from './conditions/conditions.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { VitalsModule } from './vitals/vitals.module';
import { WeeklyCheckinsModule } from './weekly-checkins/weekly-checkins.module';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    DatabaseModule,
    AuthModule,
    AccountModule,
    ConditionsModule,
    WeeklyCheckinsModule,
    VitalsModule,
  ],
})
export class AppModule {}
