import { All, Controller, Inject, Req, Res } from '@nestjs/common';
import { toNodeHandler } from 'better-auth/node';
import type { Request, Response } from 'express';
import type { AuthInstance } from './auth';
import { AUTH_INSTANCE } from './auth.constants';

@Controller('auth')
export class AuthController {
  private readonly handler: ReturnType<typeof toNodeHandler>;

  constructor(@Inject(AUTH_INSTANCE) auth: AuthInstance) {
    this.handler = toNodeHandler(auth);
  }

  @All('*path')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    await this.handler(req, res);
  }
}
