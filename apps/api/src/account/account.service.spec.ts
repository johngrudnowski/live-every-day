import { describe, expect, it, vi } from 'vitest';
import { user, verification } from 'database/schema';
import { AccountService } from './account.service';

describe('AccountService', () => {
  it('deletes verification records before deleting the authenticated user', async () => {
    const verificationDelete = {
      where: vi.fn<(condition: unknown) => Promise<void>>().mockResolvedValue(undefined),
    };
    const userDelete = {
      where: vi.fn<(condition: unknown) => Promise<void>>().mockResolvedValue(undefined),
    };
    const tx = {
      delete: vi
        .fn<(table: unknown) => typeof verificationDelete | typeof userDelete>()
        .mockReturnValueOnce(verificationDelete)
        .mockReturnValueOnce(userDelete),
    };
    const db = {
      transaction: vi.fn<(callback: (transaction: typeof tx) => Promise<void>) => Promise<void>>(
        async (callback) => {
          await callback(tx);
        },
      ),
    };
    const service = new AccountService(db as never);

    await service.deleteCurrentUser({
      id: 'user-1',
      email: 'patient@example.com',
      name: 'Patient Example',
    });

    expect(db.transaction).toHaveBeenCalledOnce();
    expect(tx.delete).toHaveBeenNthCalledWith(1, verification);
    expect(tx.delete).toHaveBeenNthCalledWith(2, user);
    expect(verificationDelete.where).toHaveBeenCalledOnce();
    expect(userDelete.where).toHaveBeenCalledOnce();
  });
});
