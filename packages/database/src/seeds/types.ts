import type { DbClient } from '../client';

export type SeedUserTarget = {
  userId: string;
  email: string;
};

export type SeedContext = {
  db: DbClient;
  now: Date;
};

export type SeedResult = {
  module: string;
  count: number;
  detail: string;
};
