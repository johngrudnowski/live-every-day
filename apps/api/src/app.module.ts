import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ConditionsModule } from './conditions/conditions.module';
import { DatabaseModule } from './database/database.module';
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
    ConditionsModule,
    WeeklyCheckinsModule,
  ],
})
export class AppModule {}
