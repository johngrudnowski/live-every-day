import { describe, expect, it, vi } from 'vitest';

vi.mock('./auth/auth.module', () => ({
  AuthModule: class AuthModule {},
}));

vi.mock('./database/database.module', () => ({
  DatabaseModule: class DatabaseModule {},
}));

import { AppModule } from './app.module';

describe('AppModule', () => {
  it('should be defined', () => {
    expect(AppModule).toBeDefined();
  });
});
