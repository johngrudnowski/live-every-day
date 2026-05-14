import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthInstance } from './auth';
import { AUTH_INSTANCE } from './auth.constants';

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
};

@Injectable()
export class AuthSessionService {
  constructor(@Inject(AUTH_INSTANCE) private readonly auth: AuthInstance) {}

  async requireUser(req: Request): Promise<AuthenticatedUser> {
    const session = await this.auth.api.getSession({
      headers: createHeadersFromRequest(req),
    });

    if (!session?.user?.id) {
      throw new UnauthorizedException('Authentication is required.');
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
  }
}

function createHeadersFromRequest(req: Request) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
      continue;
    }

    headers.set(key, value);
  }

  return headers;
}
