import { BadRequestException, ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  circleCareTeamPeople,
  circleSupportInvitations,
  circleSupportPeople,
  circleSupportPersonPermissionGrants,
} from 'database/schema';
import { CircleService } from './circle.service';

describe('CircleService', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('updates support permissions by revoking removed grants and upserting selected grants', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-16T12:00:00.000Z'));
    const supportPerson = createSupportPerson();
    const tx = createTransactionClient();
    const db = createDbClient({
      selectResults: [
        selectLimitResult([supportPerson]),
        selectWhereResult([{ key: 'weekly_score' }, { key: 'labs' }]),
        selectOrderResult([supportPerson]),
        selectOrderResult([]),
        selectJoinOrderResult([
          {
            supportPersonId: supportPerson.id,
            key: 'weekly_score',
            label: 'Weekly score',
            category: 'checkins',
          },
          {
            supportPersonId: supportPerson.id,
            key: 'labs',
            label: 'Labs',
            category: 'health_data',
          },
        ]),
      ],
      tx,
    });
    const service = new CircleService(db as never);

    const result = await service.updateSupportPermissions('user-1', supportPerson.id, {
      permissionKeys: ['weekly_score', 'labs', 'weekly_score', ''],
    });

    expect(db.transaction).toHaveBeenCalledOnce();
    expect(tx.update).toHaveBeenCalledWith(circleSupportPersonPermissionGrants);
    expect(tx.insert).toHaveBeenCalledWith(circleSupportPersonPermissionGrants);
    expect(tx.insertValues).toHaveBeenCalledWith([
      expect.objectContaining({
        supportPersonId: supportPerson.id,
        userId: 'user-1',
        permissionKey: 'weekly_score',
        grantedByUserId: 'user-1',
        revokedAt: null,
      }),
      expect.objectContaining({
        supportPersonId: supportPerson.id,
        userId: 'user-1',
        permissionKey: 'labs',
        grantedByUserId: 'user-1',
        revokedAt: null,
      }),
    ]);
    expect(tx.onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        target: [
          circleSupportPersonPermissionGrants.supportPersonId,
          circleSupportPersonPermissionGrants.permissionKey,
        ],
      }),
    );
    expect(result.supportPeople[0]?.permissions).toEqual([
      { key: 'weekly_score', label: 'Weekly score', category: 'checkins' },
      { key: 'labs', label: 'Labs', category: 'health_data' },
    ]);
  });

  it('rejects unknown permission keys before writing permission grants', async () => {
    const supportPerson = createSupportPerson();
    const tx = createTransactionClient();
    const db = createDbClient({
      selectResults: [
        selectLimitResult([supportPerson]),
        selectWhereResult([{ key: 'weekly_score' }]),
      ],
      tx,
    });
    const service = new CircleService(db as never);

    await expect(
      service.updateSupportPermissions('user-1', supportPerson.id, {
        permissionKeys: ['weekly_score', 'unknown_permission'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(db.transaction).not.toHaveBeenCalled();
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it('prevents promoting a second My #1', async () => {
    const supportPerson = createSupportPerson({ id: 'support-2', displayName: 'Dylan' });
    const db = createDbClient({
      selectResults: [
        selectLimitResult([supportPerson]),
        selectLimitResult([createSupportPerson({ id: 'support-1', role: 'my_number_one' })]),
      ],
    });
    const service = new CircleService(db as never);

    await expect(service.promoteSupportPerson('user-1', supportPerson.id)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(db.update).not.toHaveBeenCalled();
  });

  it('cancels only pending invitations for an unlinked support person', async () => {
    const supportPerson = createSupportPerson({ inviteStatus: 'pending' });
    const tx = createTransactionClient();
    const db = createDbClient({
      selectResults: [
        selectLimitResult([supportPerson]),
        selectOrderResult([{ ...supportPerson, inviteStatus: 'canceled' }]),
        selectOrderResult([]),
        selectJoinOrderResult([]),
      ],
      tx,
    });
    const service = new CircleService(db as never);

    const result = await service.cancelSupportInvitation('user-1', supportPerson.id);

    expect(tx.update).toHaveBeenNthCalledWith(1, circleSupportInvitations);
    expect(tx.updateSet).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ revokedAt: expect.any(Date) }),
    );
    expect(tx.update).toHaveBeenNthCalledWith(2, circleSupportPeople);
    expect(tx.updateSet).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ inviteStatus: 'canceled' }),
    );
    expect(result.supportPeople[0]?.inviteStatus).toBe('canceled');
  });

  it('removes an owned support person', async () => {
    const supportPerson = createSupportPerson();
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const db = createDbClient({
      selectResults: [selectLimitResult([supportPerson])],
      deleteWhere,
    });
    const service = new CircleService(db as never);

    await service.removeSupportPerson('user-1', supportPerson.id);

    expect(db.delete).toHaveBeenCalledWith(circleSupportPeople);
    expect(deleteWhere).toHaveBeenCalledOnce();
  });

  it('creates a local care team member with contact details', async () => {
    const db = createDbClient({
      selectResults: [
        selectLimitResult([]),
        selectWhereOrderLimitResult([{ sortOrder: 2 }]),
        selectOrderResult([]),
        selectOrderResult([
          createCareTeamPerson({
            displayName: 'Dr. Taylor Morgan',
            initials: 'TM',
            specialty: 'Hematology',
            organization: 'Mayo Clinic',
            address: '200 1st St SW, Rochester, MN 55905',
            phoneNumber: '(507) 284-2511',
            sortOrder: 3,
          }),
        ]),
        selectJoinOrderResult([]),
      ],
    });
    const service = new CircleService(db as never);

    const result = await service.createCareTeamPerson('user-1', {
      displayName: ' Dr. Taylor Morgan ',
      specialty: ' Hematology ',
      organization: 'Mayo Clinic',
      address: '200 1st St SW, Rochester, MN 55905',
      phoneNumber: '(507) 284-2511',
    });

    expect(db.insert).toHaveBeenCalledWith(circleCareTeamPeople);
    expect(db.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        displayName: 'Dr. Taylor Morgan',
        initials: 'DT',
        role: 'hematology',
        specialty: 'Hematology',
        organization: 'Mayo Clinic',
        address: '200 1st St SW, Rochester, MN 55905',
        phoneNumber: '(507) 284-2511',
        connectionStatus: 'local',
        sortOrder: 3,
      }),
    );
    expect(result.careTeamPeople[0]).toEqual(
      expect.objectContaining({
        displayName: 'Dr. Taylor Morgan',
        address: '200 1st St SW, Rochester, MN 55905',
        phoneNumber: '(507) 284-2511',
      }),
    );
  });
});

function createSupportPerson(
  overrides: Partial<CircleSupportPersonRow> = {},
): CircleSupportPersonRow {
  const now = new Date('2026-05-16T12:00:00.000Z');

  return {
    id: 'support-1',
    userId: 'user-1',
    linkedUserId: null,
    displayName: 'Ashton',
    initials: 'A',
    relationship: 'Family',
    role: 'support',
    inviteStatus: 'active',
    invitationEmail: null,
    invitationPhone: null,
    sortOrder: 1,
    invitedAt: now,
    acceptedAt: null,
    lastMessageAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createDbClient({
  selectResults,
  tx = createTransactionClient(),
  deleteWhere = vi.fn().mockResolvedValue(undefined),
  insertValues = vi.fn().mockResolvedValue(undefined),
}: {
  selectResults: unknown[];
  tx?: ReturnType<typeof createTransactionClient>;
  deleteWhere?: ReturnType<typeof vi.fn>;
  insertValues?: ReturnType<typeof vi.fn>;
}) {
  return {
    select: vi.fn(() => {
      const next = selectResults.shift();

      if (!next) {
        throw new Error('Unexpected select call.');
      }

      return next;
    }),
    update: vi.fn(),
    insert: vi.fn(() => ({ values: insertValues })),
    insertValues,
    delete: vi.fn(() => ({ where: deleteWhere })),
    transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<void>) => {
      await callback(tx);
    }),
  };
}

function createCareTeamPerson(
  overrides: Partial<CircleCareTeamPersonRow> = {},
): CircleCareTeamPersonRow {
  const now = new Date('2026-05-16T12:00:00.000Z');

  return {
    id: 'care-1',
    userId: 'user-1',
    providerUserId: null,
    displayName: 'Dr. Taylor Morgan',
    initials: 'TM',
    role: 'hematology',
    specialty: 'Hematology',
    organization: 'Mayo Clinic',
    address: null,
    phoneNumber: null,
    connectionStatus: 'local',
    externalProviderId: null,
    metadataJson: {},
    sortOrder: 0,
    connectedAt: null,
    nextAppointmentAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createTransactionClient() {
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const insertValues = vi.fn(() => ({ onConflictDoUpdate }));
  const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);

  return {
    update: vi.fn(() => ({ set: updateSet })),
    updateSet,
    updateWhere,
    insert: vi.fn(() => ({ values: insertValues })),
    insertValues,
    onConflictDoUpdate,
  };
}

function selectLimitResult(rows: unknown[]) {
  return {
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn().mockResolvedValue(rows),
      })),
    })),
  };
}

function selectWhereResult(rows: unknown[]) {
  return {
    from: vi.fn(() => ({
      where: vi.fn().mockResolvedValue(rows),
    })),
  };
}

function selectOrderResult(rows: unknown[]) {
  return {
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        orderBy: vi.fn().mockResolvedValue(rows),
      })),
    })),
  };
}

function selectWhereOrderLimitResult(rows: unknown[]) {
  return {
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue(rows),
        })),
      })),
    })),
  };
}

function selectJoinOrderResult(rows: unknown[]) {
  return {
    from: vi.fn(() => ({
      innerJoin: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn().mockResolvedValue(rows),
        })),
      })),
    })),
  };
}

type CircleSupportPersonRow = typeof circleSupportPeople.$inferSelect;
type CircleCareTeamPersonRow = typeof circleCareTeamPeople.$inferSelect;
