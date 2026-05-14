import { Body, Controller, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthSessionService } from '../auth/auth-session.service';
import { ConditionDefinitionDto, ConditionRegistryItemDto } from './dto/condition-definition.dto';
import { ConditionSummaryDto, UserConditionProfileSummaryDto } from './dto/condition-summary.dto';
import { SaveConditionProfileDto } from './dto/save-condition-profile.dto';
import { ConditionsService } from './conditions.service';

@ApiTags('Conditions')
@Controller('api')
export class ConditionsController {
  constructor(
    private readonly authSessionService: AuthSessionService,
    private readonly conditionsService: ConditionsService,
  ) {}

  @Get('conditions')
  @ApiOkResponse({ type: ConditionRegistryItemDto, isArray: true })
  listConditions() {
    return this.conditionsService.listConditions();
  }

  @Get('conditions/:conditionId')
  @ApiOkResponse({ type: ConditionDefinitionDto })
  getCondition(@Param('conditionId') conditionId: string) {
    return this.conditionsService.getCondition(conditionId);
  }

  @Get('me/condition-summary')
  @ApiOkResponse({ type: ConditionSummaryDto })
  async getSummary(@Req() req: Request) {
    const user = await this.authSessionService.requireUser(req);
    return await this.conditionsService.getSummary(user.id);
  }

  @Get('me/condition-profiles')
  @ApiOkResponse({ type: UserConditionProfileSummaryDto, isArray: true })
  async listProfiles(@Req() req: Request) {
    const user = await this.authSessionService.requireUser(req);
    return await this.conditionsService.listProfileSummaries(user.id);
  }

  @Put('me/condition-profiles/:conditionId')
  @ApiOkResponse({ type: ConditionSummaryDto })
  async saveProfile(
    @Req() req: Request,
    @Param('conditionId') conditionId: string,
    @Body() dto: SaveConditionProfileDto,
  ) {
    const user = await this.authSessionService.requireUser(req);
    return await this.conditionsService.saveProfile(user.id, conditionId, dto);
  }

  @Post('me/condition-onboarding/skip')
  @ApiOkResponse({ type: ConditionSummaryDto })
  async skipOnboarding(@Req() req: Request) {
    const user = await this.authSessionService.requireUser(req);
    return await this.conditionsService.skipOnboarding(user.id);
  }
}
