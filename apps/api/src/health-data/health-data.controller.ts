import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthSessionService } from '../auth/auth-session.service';
import {
  DailyHealthSummaryDto,
  HealthObservationListDto,
  LatestHealthObservationsDto,
  LatestVitalReadingDto,
  VitalMetricsSummaryDto,
  VitalReadingDto,
} from './dto/health-observation.dto';
import {
  SaveHealthObservationsDto,
  SaveHealthVitalReadingDto,
} from './dto/save-health-observation.dto';
import { HealthDataService } from './health-data.service';

@ApiTags('Health data')
@Controller('api/me/health')
export class HealthDataController {
  constructor(
    private readonly authSessionService: AuthSessionService,
    private readonly healthDataService: HealthDataService,
  ) {}

  @Post('observations')
  @ApiOkResponse({ type: HealthObservationListDto })
  async saveObservations(@Req() req: Request, @Body() dto: SaveHealthObservationsDto) {
    const user = await this.authSessionService.requireUser(req);
    return await this.healthDataService.saveObservations(user.id, dto);
  }

  @Get('observations')
  @ApiOkResponse({ type: HealthObservationListDto })
  async listObservations(
    @Req() req: Request,
    @Query('metricKey') metricKey?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    const user = await this.authSessionService.requireUser(req);
    return await this.healthDataService.listObservations({
      userId: user.id,
      metricKey,
      from,
      to,
      limit,
    });
  }

  @Get('observations/latest')
  @ApiOkResponse({ type: LatestHealthObservationsDto })
  async getLatestObservations(@Req() req: Request, @Query('metricKeys') metricKeys?: string) {
    const user = await this.authSessionService.requireUser(req);
    return await this.healthDataService.getLatestObservations(user.id, metricKeys);
  }

  @Get('observations/history')
  @ApiOkResponse({ type: HealthObservationListDto })
  async getObservationHistory(
    @Req() req: Request,
    @Query('metricKey') metricKey: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    const user = await this.authSessionService.requireUser(req);
    return await this.healthDataService.getObservationHistory({
      userId: user.id,
      metricKey,
      from,
      to,
      limit,
    });
  }

  @Get('summary/daily')
  @ApiOkResponse({ type: DailyHealthSummaryDto })
  async getDailySummary(
    @Req() req: Request,
    @Query('metricKeys') metricKeys?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const user = await this.authSessionService.requireUser(req);
    return await this.healthDataService.getDailySummary({
      userId: user.id,
      metricKeysInput: metricKeys,
      from,
      to,
    });
  }

  @Get('vitals/latest')
  @ApiOkResponse({ type: LatestVitalReadingDto })
  async getLatestVitalReading(@Req() req: Request) {
    const user = await this.authSessionService.requireUser(req);
    return await this.healthDataService.getLatestVitalReading(user.id);
  }

  @Get('vitals/summary')
  @ApiOkResponse({ type: VitalMetricsSummaryDto })
  async getVitalMetricsSummary(@Req() req: Request) {
    const user = await this.authSessionService.requireUser(req);
    return await this.healthDataService.getVitalMetricsSummary(user.id);
  }

  @Post('vitals/readings')
  @ApiOkResponse({ type: VitalReadingDto })
  async saveVitalReading(@Req() req: Request, @Body() dto: SaveHealthVitalReadingDto) {
    const user = await this.authSessionService.requireUser(req);
    return await this.healthDataService.saveVitalReading(user.id, dto);
  }
}
