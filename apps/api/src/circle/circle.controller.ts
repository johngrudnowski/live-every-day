import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthSessionService } from '../auth/auth-session.service';
import { CircleService } from './circle.service';
import {
  AcceptCircleInvitationResponseDto,
  CircleInvitationLinkDto,
  CircleInvitationPreviewDto,
  CreateSupportPersonInviteDto,
  CreateSupportPersonInviteResponseDto,
  RegenerateSupportInvitationDto,
} from './dto/circle-invite.dto';
import { CircleAppointmentDto, SaveCircleAppointmentDto } from './dto/circle-appointment.dto';
import { CircleSupportMessageDto, SendCircleSupportMessageDto } from './dto/circle-message.dto';
import { SaveCircleCareTeamPersonDto } from './dto/manage-circle-care-team-person.dto';
import {
  UpdateCircleSupportPermissionsDto,
  UpdateCircleSupportPersonDto,
} from './dto/manage-circle-support-person.dto';
import { CirclePermissionDefinitionDto, MyCircleDto } from './dto/my-circle.dto';

@ApiTags('Circle')
@Controller('api/me/circle')
export class CircleController {
  constructor(
    private readonly authSessionService: AuthSessionService,
    private readonly circleService: CircleService,
  ) {}

  @Get()
  @ApiOkResponse({ type: MyCircleDto })
  async getMyCircle(@Req() req: Request) {
    const user = await this.authSessionService.requireUser(req);
    return await this.circleService.getMyCircle(user.id);
  }

  @Get('permissions')
  @ApiOkResponse({ type: CirclePermissionDefinitionDto, isArray: true })
  async getPermissionDefinitions(@Req() req: Request) {
    await this.authSessionService.requireUser(req);
    return await this.circleService.getPermissionDefinitions();
  }

  @Post('support-people')
  @ApiOkResponse({ type: CreateSupportPersonInviteResponseDto })
  async createSupportPersonInvite(@Req() req: Request, @Body() dto: CreateSupportPersonInviteDto) {
    const user = await this.authSessionService.requireUser(req);
    return await this.circleService.createSupportPersonInvite(user, dto);
  }

  @Patch('support-people/:supportPersonId')
  @ApiOkResponse({ type: MyCircleDto })
  async updateSupportPerson(
    @Req() req: Request,
    @Param('supportPersonId') supportPersonId: string,
    @Body() dto: UpdateCircleSupportPersonDto,
  ) {
    const user = await this.authSessionService.requireUser(req);
    return await this.circleService.updateSupportPerson(user.id, supportPersonId, dto);
  }

  @Patch('support-people/:supportPersonId/permissions')
  @ApiOkResponse({ type: MyCircleDto })
  async updateSupportPermissions(
    @Req() req: Request,
    @Param('supportPersonId') supportPersonId: string,
    @Body() dto: UpdateCircleSupportPermissionsDto,
  ) {
    const user = await this.authSessionService.requireUser(req);
    return await this.circleService.updateSupportPermissions(user.id, supportPersonId, dto);
  }

  @Post('support-people/:supportPersonId/cancel-invitation')
  @ApiOkResponse({ type: MyCircleDto })
  async cancelSupportInvitation(
    @Req() req: Request,
    @Param('supportPersonId') supportPersonId: string,
  ) {
    const user = await this.authSessionService.requireUser(req);
    return await this.circleService.cancelSupportInvitation(user.id, supportPersonId);
  }

  @Post('support-people/:supportPersonId/promote')
  @ApiOkResponse({ type: MyCircleDto })
  async promoteSupportPerson(
    @Req() req: Request,
    @Param('supportPersonId') supportPersonId: string,
  ) {
    const user = await this.authSessionService.requireUser(req);
    return await this.circleService.promoteSupportPerson(user.id, supportPersonId);
  }

  @Post('support-people/:supportPersonId/demote')
  @ApiOkResponse({ type: MyCircleDto })
  async demoteSupportPerson(
    @Req() req: Request,
    @Param('supportPersonId') supportPersonId: string,
  ) {
    const user = await this.authSessionService.requireUser(req);
    return await this.circleService.demoteSupportPerson(user.id, supportPersonId);
  }

  @Delete('support-people/:supportPersonId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Removes a support person from the circle.' })
  async removeSupportPerson(
    @Req() req: Request,
    @Param('supportPersonId') supportPersonId: string,
  ) {
    const user = await this.authSessionService.requireUser(req);
    await this.circleService.removeSupportPerson(user.id, supportPersonId);
  }

  @Post('support-people/:supportPersonId/invitations')
  @ApiOkResponse({ type: CircleInvitationLinkDto })
  async regenerateSupportInvitation(
    @Req() req: Request,
    @Param('supportPersonId') supportPersonId: string,
    @Body() dto: RegenerateSupportInvitationDto,
  ) {
    const user = await this.authSessionService.requireUser(req);
    return await this.circleService.regenerateSupportInvitation(
      user,
      supportPersonId,
      dto.deliveryMethod,
    );
  }

  @Get('support-messages')
  @ApiOkResponse({ type: CircleSupportMessageDto, isArray: true })
  async getSupportMessages(@Req() req: Request) {
    const user = await this.authSessionService.requireUser(req);
    return await this.circleService.getSupportMessages(user.id);
  }

  @Get('appointments')
  @ApiOkResponse({ type: CircleAppointmentDto, isArray: true })
  async getAppointments(@Req() req: Request) {
    const user = await this.authSessionService.requireUser(req);
    return await this.circleService.getAppointments(user.id);
  }

  @Post('appointments')
  @ApiOkResponse({ type: CircleAppointmentDto })
  async createAppointment(@Req() req: Request, @Body() dto: SaveCircleAppointmentDto) {
    const user = await this.authSessionService.requireUser(req);
    return await this.circleService.createAppointment(user.id, dto);
  }

  @Patch('appointments/:appointmentId')
  @ApiOkResponse({ type: CircleAppointmentDto })
  async updateAppointment(
    @Req() req: Request,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: SaveCircleAppointmentDto,
  ) {
    const user = await this.authSessionService.requireUser(req);
    return await this.circleService.updateAppointment(user.id, appointmentId, dto);
  }

  @Delete('appointments/:appointmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Removes a care team appointment.' })
  async removeAppointment(@Req() req: Request, @Param('appointmentId') appointmentId: string) {
    const user = await this.authSessionService.requireUser(req);
    await this.circleService.removeAppointment(user.id, appointmentId);
  }

  @Post('care-team-people')
  @ApiOkResponse({ type: MyCircleDto })
  async createCareTeamPerson(@Req() req: Request, @Body() dto: SaveCircleCareTeamPersonDto) {
    const user = await this.authSessionService.requireUser(req);
    return await this.circleService.createCareTeamPerson(user.id, dto);
  }

  @Patch('care-team-people/:careTeamPersonId')
  @ApiOkResponse({ type: MyCircleDto })
  async updateCareTeamPerson(
    @Req() req: Request,
    @Param('careTeamPersonId') careTeamPersonId: string,
    @Body() dto: SaveCircleCareTeamPersonDto,
  ) {
    const user = await this.authSessionService.requireUser(req);
    return await this.circleService.updateCareTeamPerson(user.id, careTeamPersonId, dto);
  }

  @Delete('care-team-people/:careTeamPersonId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Removes a local care team member from the circle.' })
  async removeCareTeamPerson(
    @Req() req: Request,
    @Param('careTeamPersonId') careTeamPersonId: string,
  ) {
    const user = await this.authSessionService.requireUser(req);
    await this.circleService.removeCareTeamPerson(user.id, careTeamPersonId);
  }
}

@ApiTags('Circle')
@Controller('api/circle/invitations')
export class CircleInvitationsController {
  constructor(
    private readonly authSessionService: AuthSessionService,
    private readonly circleService: CircleService,
  ) {}

  @Get(':token')
  @ApiOkResponse({ type: CircleInvitationPreviewDto })
  async previewInvitation(@Param('token') token: string) {
    return await this.circleService.previewInvitation(token);
  }

  @Post(':token/accept')
  @ApiOkResponse({ type: AcceptCircleInvitationResponseDto })
  async acceptInvitation(@Req() req: Request, @Param('token') token: string) {
    const user = await this.authSessionService.requireUser(req);
    return await this.circleService.acceptInvitation(token, user);
  }
}

@ApiTags('Circle')
@Controller('api/circle/support-people')
export class CircleSupportPeopleController {
  constructor(
    private readonly authSessionService: AuthSessionService,
    private readonly circleService: CircleService,
  ) {}

  @Post(':supportPersonId/messages')
  @ApiOkResponse({ type: CircleSupportMessageDto })
  async sendSupportMessage(
    @Req() req: Request,
    @Param('supportPersonId') supportPersonId: string,
    @Body() dto: SendCircleSupportMessageDto,
  ) {
    const user = await this.authSessionService.requireUser(req);
    return await this.circleService.sendSupportMessage(user, supportPersonId, dto);
  }
}
