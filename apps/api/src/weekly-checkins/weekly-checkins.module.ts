import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { WeeklyCheckinsController } from './weekly-checkins.controller';
import { WeeklyCheckinsService } from './weekly-checkins.service';

@Module({
  controllers: [WeeklyCheckinsController],
  imports: [AuthModule, DatabaseModule],
  providers: [WeeklyCheckinsService],
})
export class WeeklyCheckinsModule {}
