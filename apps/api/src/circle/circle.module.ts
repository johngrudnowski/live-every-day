import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import {
  CircleController,
  CircleInvitationsController,
  CircleSupportPeopleController,
} from './circle.controller';
import { CircleService } from './circle.service';

@Module({
  controllers: [CircleController, CircleInvitationsController, CircleSupportPeopleController],
  imports: [AuthModule, DatabaseModule],
  providers: [CircleService],
})
export class CircleModule {}
