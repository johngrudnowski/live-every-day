import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountModule } from './account/account.module';
import { AuthModule } from './auth/auth.module';
import { CircleModule } from './circle/circle.module';
import { ConditionsModule } from './conditions/conditions.module';
import { DatabaseModule } from './database/database.module';
import { HealthDataModule } from './health-data/health-data.module';
import { HealthController } from './health/health.controller';
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
    CircleModule,
    ConditionsModule,
    WeeklyCheckinsModule,
    HealthDataModule,
  ],
})
export class AppModule {}
