import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { HealthImportCommitService } from './health-import-commit.service';
import { HealthImportNormalizationService } from './health-import-normalization.service';
import { HealthImportsController } from './health-imports.controller';
import { HealthImportsService } from './health-imports.service';

@Module({
  controllers: [HealthImportsController],
  imports: [AuthModule, DatabaseModule],
  providers: [HealthImportsService, HealthImportNormalizationService, HealthImportCommitService],
})
export class HealthImportsModule {}
