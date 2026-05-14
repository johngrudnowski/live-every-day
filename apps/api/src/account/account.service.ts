import { Inject, Injectable } from '@nestjs/common';
import type { DbClient } from 'database/client';
import { user, verification } from 'database/schema';
import { eq } from 'drizzle-orm';
import { DB_CLIENT } from '../database/database.constants';
import type { AuthenticatedUser } from '../auth/auth-session.service';

@Injectable()
export class AccountService {
  constructor(@Inject(DB_CLIENT) private readonly db: DbClient) {}

  async deleteCurrentUser(currentUser: AuthenticatedUser) {
    await this.db.transaction(async (tx) => {
      await tx.delete(verification).where(eq(verification.identifier, currentUser.email));
      await tx.delete(user).where(eq(user.id, currentUser.id));
    });
  }
}
