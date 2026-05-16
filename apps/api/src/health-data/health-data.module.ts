import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { HealthDataController } from './health-data.controller';
import { HealthDataService } from './health-data.service';

@Module({
  controllers: [HealthDataController],
  imports: [AuthModule, DatabaseModule],
  providers: [HealthDataService],
})
export class HealthDataModule {}
