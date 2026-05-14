import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { VitalsController } from './vitals.controller';
import { VitalsService } from './vitals.service';

@Module({
  controllers: [VitalsController],
  imports: [AuthModule, DatabaseModule],
  providers: [VitalsService],
})
export class VitalsModule {}
