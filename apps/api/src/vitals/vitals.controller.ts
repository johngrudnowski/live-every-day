import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthSessionService } from '../auth/auth-session.service';
import { SaveVitalReadingDto } from './dto/save-vital-reading.dto';
import { LatestVitalReadingDto, VitalReadingDto } from './dto/vital-reading.dto';
import { VitalsService } from './vitals.service';

@ApiTags('Vitals')
@Controller('api/me/vitals')
export class VitalsController {
  constructor(
    private readonly authSessionService: AuthSessionService,
    private readonly vitalsService: VitalsService,
  ) {}

  @Get('latest')
  @ApiOkResponse({ type: LatestVitalReadingDto })
  async getLatestReading(@Req() req: Request) {
    const user = await this.authSessionService.requireUser(req);
    return await this.vitalsService.getLatestReading(user.id);
  }

  @Post('readings')
  @ApiOkResponse({ type: VitalReadingDto })
  async saveReading(@Req() req: Request, @Body() dto: SaveVitalReadingDto) {
    const user = await this.authSessionService.requireUser(req);
    return await this.vitalsService.saveReading(user.id, dto);
  }
}
