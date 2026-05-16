import { Body, Controller, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthSessionService } from '../auth/auth-session.service';
import { SaveWeeklyCheckinDraftDto, SubmitWeeklyCheckinDto } from './dto/save-weekly-checkin.dto';
import { WeeklyCheckinDto, WeeklyCheckinSummaryDto } from './dto/weekly-checkin.dto';
import { WeeklyCheckinsService } from './weekly-checkins.service';

@ApiTags('Weekly Checkins')
@Controller('api/me/weekly-checkin')
export class WeeklyCheckinsController {
  constructor(
    private readonly authSessionService: AuthSessionService,
    private readonly weeklyCheckinsService: WeeklyCheckinsService,
  ) {}

  @Get('summary')
  @ApiOkResponse({ type: WeeklyCheckinSummaryDto })
  async getSummary(@Req() req: Request) {
    const user = await this.authSessionService.requireUser(req);
    return await this.weeklyCheckinsService.getSummary(user.id);
  }

  @Get('current')
  @ApiOkResponse({ type: WeeklyCheckinSummaryDto })
  async getCurrent(@Req() req: Request) {
    const user = await this.authSessionService.requireUser(req);
    return await this.weeklyCheckinsService.getCurrent(user.id);
  }

  @Get('history')
  @ApiOkResponse({ type: WeeklyCheckinDto, isArray: true })
  async getHistory(@Req() req: Request) {
    const user = await this.authSessionService.requireUser(req);
    return await this.weeklyCheckinsService.getHistory(user.id);
  }

  @Put('current')
  @ApiOkResponse({ type: WeeklyCheckinSummaryDto })
  async saveDraft(@Req() req: Request, @Body() dto: SaveWeeklyCheckinDraftDto) {
    const user = await this.authSessionService.requireUser(req);
    return await this.weeklyCheckinsService.saveDraft(user.id, dto);
  }

  @Post('current/submit')
  @ApiOkResponse({ type: WeeklyCheckinSummaryDto })
  async submit(@Req() req: Request, @Body() dto: SubmitWeeklyCheckinDto) {
    const user = await this.authSessionService.requireUser(req);
    return await this.weeklyCheckinsService.submit(user.id, dto);
  }

  @Get(':checkinId')
  @ApiOkResponse({ type: WeeklyCheckinDto })
  async getCheckin(@Req() req: Request, @Param('checkinId') checkinId: string) {
    const user = await this.authSessionService.requireUser(req);
    return await this.weeklyCheckinsService.getCheckin(user.id, checkinId);
  }

  @Put(':checkinId')
  @ApiOkResponse({ type: WeeklyCheckinDto })
  async updateCheckin(
    @Req() req: Request,
    @Param('checkinId') checkinId: string,
    @Body() dto: SubmitWeeklyCheckinDto,
  ) {
    const user = await this.authSessionService.requireUser(req);
    return await this.weeklyCheckinsService.updateCheckin(user.id, checkinId, dto);
  }
}
