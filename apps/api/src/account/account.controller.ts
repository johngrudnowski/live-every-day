import { Controller, Delete, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthSessionService } from '../auth/auth-session.service';
import { AccountService } from './account.service';

@ApiTags('Account')
@Controller('api/me/account')
export class AccountController {
  constructor(
    private readonly authSessionService: AuthSessionService,
    private readonly accountService: AccountService,
  ) {}

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Deletes the authenticated account and all user data.' })
  async deleteCurrentUser(@Req() req: Request) {
    const user = await this.authSessionService.requireUser(req);
    await this.accountService.deleteCurrentUser(user);
  }
}
