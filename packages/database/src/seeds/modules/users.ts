import { eq } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { user } from '../../schema';
import type { SeedContext, SeedUserTarget } from '../types';

export async function seedUser(ctx: SeedContext, email: string): Promise<SeedUserTarget> {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findUserByEmail(ctx, normalizedEmail);
  if (existing) {
    await ctx.db
      .update(user)
      .set({
        emailVerified: true,
        updatedAt: ctx.now,
      })
      .where(eq(user.id, existing.id));

    return {
      userId: existing.id,
      email: existing.email,
    };
  }

  const [created] = await ctx.db
    .insert(user)
    .values({
      id: createSeedUserId(normalizedEmail),
      name: createSeedUserName(normalizedEmail),
      email: normalizedEmail,
      emailVerified: true,
      updatedAt: ctx.now,
    })
    .returning({
      id: user.id,
      email: user.email,
    });

  return {
    userId: created.id,
    email: created.email,
  };
}

async function findUserByEmail(ctx: SeedContext, email: string) {
  const [row] = await ctx.db
    .select({
      id: user.id,
      email: user.email,
    })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  return row ?? null;
}

function createSeedUserId(email: string) {
  const digest = createHash('sha256').update(email).digest('hex').slice(0, 24);
  return `seed_user_${digest}`;
}

function createSeedUserName(email: string) {
  const localPart = email.split('@')[0] || 'seed-user';
  return (
    localPart
      .split(/[._+-]+/)
      .filter(Boolean)
      .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
      .join(' ') || 'Seed User'
  );
}
