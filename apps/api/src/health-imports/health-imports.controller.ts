import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthSessionService } from '../auth/auth-session.service';
import { CreateManualLabImportDto } from './dto/create-manual-lab-import.dto';
import { HealthImportDto, HealthImportListDto } from './dto/health-import.dto';
import { ReviewHealthImportCandidatesDto } from './dto/review-health-import.dto';
import { UpdateHealthImportCandidateDto } from './dto/update-health-import-candidate.dto';
import { HealthImportsService } from './health-imports.service';

@ApiTags('Health imports')
@Controller('api/me/health/imports')
export class HealthImportsController {
  constructor(
    private readonly authSessionService: AuthSessionService,
    private readonly healthImportsService: HealthImportsService,
  ) {}

  @Get()
  @ApiOkResponse({ type: HealthImportListDto })
  async listImports(@Req() req: Request) {
    const user = await this.authSessionService.requireUser(req);
    return await this.healthImportsService.listImports(user.id);
  }

  @Post('labs/manual')
  @ApiOkResponse({ type: HealthImportDto })
  async createManualLabImport(
    @Req() req: Request,
    @Body() dto: CreateManualLabImportDto,
  ) {
    const user = await this.authSessionService.requireUser(req);
    return await this.healthImportsService.createManualLabImport(user.id, dto);
  }

  @Get(':jobId')
  @ApiOkResponse({ type: HealthImportDto })
  async getImport(@Req() req: Request, @Param('jobId') jobId: string) {
    const user = await this.authSessionService.requireUser(req);
    return await this.healthImportsService.getImport(user.id, jobId);
  }

  @Patch(':jobId/candidates/:candidateId')
  @ApiOkResponse({ type: HealthImportDto })
  async updateCandidate(
    @Req() req: Request,
    @Param('jobId') jobId: string,
    @Param('candidateId') candidateId: string,
    @Body() dto: UpdateHealthImportCandidateDto,
  ) {
    const user = await this.authSessionService.requireUser(req);
    return await this.healthImportsService.updateCandidate(
      user.id,
      jobId,
      candidateId,
      dto,
    );
  }

  @Post(':jobId/accept')
  @ApiOkResponse({ type: HealthImportDto })
  async acceptCandidates(
    @Req() req: Request,
    @Param('jobId') jobId: string,
    @Body() dto: ReviewHealthImportCandidatesDto,
  ) {
    const user = await this.authSessionService.requireUser(req);
    return await this.healthImportsService.acceptCandidates(
      user.id,
      jobId,
      dto.candidateIds,
    );
  }

  @Post(':jobId/reject')
  @ApiOkResponse({ type: HealthImportDto })
  async rejectCandidates(
    @Req() req: Request,
    @Param('jobId') jobId: string,
    @Body() dto: ReviewHealthImportCandidatesDto,
  ) {
    const user = await this.authSessionService.requireUser(req);
    return await this.healthImportsService.rejectCandidates(
      user.id,
      jobId,
      dto.candidateIds,
    );
  }
}
