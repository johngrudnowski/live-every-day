import { BadRequestException, ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  circleCareTeamAppointments,
  circleCareTeamPeople,
  circleSupportInvitations,
  circleSupportPeople,
  circleSupportPersonPermissionGrants,
} from 'database/schema';
import { CircleService } from './circle.service';

type MockImplementation = (...args: any[]) => any;

function mockFn<T extends MockImplementation>(implementation?: T) {
  return vi.fn<T>(implementation);
}

function mockResolved<T>(value: T) {
  return vi.fn<() => Promise<T>>(async () => value);
}

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
    const deleteWhere = mockResolved(undefined);
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

  it('creates an appointment for an owned care team member', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-16T12:00:00.000Z'));
    const careTeamPerson = createCareTeamPerson();
    const appointment = createAppointment({
      careTeamDisplayName: careTeamPerson.displayName,
      careTeamSpecialty: careTeamPerson.specialty,
      scheduledAt: new Date('2026-06-09T14:30:00.000Z'),
      location: 'Mayo Clinic',
      notes: 'Ask about symptom trends.',
    });
    const db = createDbClient({
      selectResults: [
        selectLimitResult([careTeamPerson]),
        selectJoinOrderLimitResult([appointment]),
      ],
    });
    const service = new CircleService(db as never);

    const result = await service.createAppointment('user-1', {
      careTeamPersonId: careTeamPerson.id,
      scheduledAt: '2026-06-09T14:30:00.000Z',
      location: ' Mayo Clinic ',
      notes: ' Ask about symptom trends. ',
    });

    expect(db.insert).toHaveBeenCalledWith(circleCareTeamAppointments);
    expect(db.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        careTeamPersonId: careTeamPerson.id,
        scheduledAt: new Date('2026-06-09T14:30:00.000Z'),
        location: 'Mayo Clinic',
        notes: 'Ask about symptom trends.',
        updatedAt: new Date('2026-05-16T12:00:00.000Z'),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        careTeamPersonId: careTeamPerson.id,
        careTeamDisplayName: careTeamPerson.displayName,
        scheduledAt: '2026-06-09T14:30:00.000Z',
        location: 'Mayo Clinic',
        notes: 'Ask about symptom trends.',
      }),
    );
  });

  it('rejects invalid appointment dates before writing', async () => {
    const db = createDbClient({ selectResults: [] });
    const service = new CircleService(db as never);

    await expect(
      service.createAppointment('user-1', {
        careTeamPersonId: 'care-1',
        scheduledAt: 'not-a-date',
        location: null,
        notes: null,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(db.insert).not.toHaveBeenCalled();
  });

  it('removes an owned appointment', async () => {
    const appointment = createAppointment();
    const deleteWhere = mockResolved(undefined);
    const db = createDbClient({
      selectResults: [selectLimitResult([appointment])],
      deleteWhere,
    });
    const service = new CircleService(db as never);

    await service.removeAppointment('user-1', appointment.id);

    expect(db.delete).toHaveBeenCalledWith(circleCareTeamAppointments);
    expect(deleteWhere).toHaveBeenCalledOnce();
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
  deleteWhere = mockResolved(undefined),
  insertValues = mockResolved(undefined),
}: {
  selectResults: unknown[];
  tx?: ReturnType<typeof createTransactionClient>;
  deleteWhere?: ReturnType<typeof vi.fn>;
  insertValues?: ReturnType<typeof vi.fn>;
}) {
  return {
    select: mockFn(() => {
      const next = selectResults.shift();

      if (!next) {
        throw new Error('Unexpected select call.');
      }

      return next;
    }),
    update: mockFn(),
    insert: mockFn(() => ({ values: insertValues })),
    insertValues,
    delete: mockFn(() => ({ where: deleteWhere })),
    transaction: mockFn(async (callback: (transaction: typeof tx) => Promise<void>) => {
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

function createAppointment(
  overrides: Partial<
    CircleCareTeamAppointmentRow & {
      careTeamDisplayName: string;
      careTeamSpecialty: string | null;
    }
  > = {},
): CircleCareTeamAppointmentRow & {
  careTeamDisplayName: string;
  careTeamSpecialty: string | null;
} {
  const now = new Date('2026-05-16T12:00:00.000Z');

  return {
    id: 'appointment-1',
    userId: 'user-1',
    careTeamPersonId: 'care-1',
    scheduledAt: new Date('2026-06-09T14:30:00.000Z'),
    location: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
    careTeamDisplayName: 'Dr. Taylor Morgan',
    careTeamSpecialty: 'Hematology',
    ...overrides,
  };
}

function createTransactionClient() {
  const updateWhere = mockResolved(undefined);
  const updateSet = mockFn(() => ({ where: updateWhere }));
  const insertValues = mockFn(() => ({ onConflictDoUpdate }));
  const onConflictDoUpdate = mockResolved(undefined);

  return {
    update: mockFn(() => ({ set: updateSet })),
    updateSet,
    updateWhere,
    insert: mockFn(() => ({ values: insertValues })),
    insertValues,
    onConflictDoUpdate,
  };
}

function selectLimitResult(rows: unknown[]) {
  return {
    from: mockFn(() => ({
      where: mockFn(() => ({
        limit: mockResolved(rows),
      })),
    })),
  };
}

function selectWhereResult(rows: unknown[]) {
  return {
    from: mockFn(() => ({
      where: mockResolved(rows),
    })),
  };
}

function selectOrderResult(rows: unknown[]) {
  return {
    from: mockFn(() => ({
      where: mockFn(() => ({
        orderBy: mockResolved(rows),
      })),
    })),
  };
}

function selectWhereOrderLimitResult(rows: unknown[]) {
  return {
    from: mockFn(() => ({
      where: mockFn(() => ({
        orderBy: mockFn(() => ({
          limit: mockResolved(rows),
        })),
      })),
    })),
  };
}

function selectJoinOrderResult(rows: unknown[]) {
  return {
    from: mockFn(() => ({
      innerJoin: mockFn(() => ({
        where: mockFn(() => ({
          orderBy: mockResolved(rows),
        })),
      })),
    })),
  };
}

function selectJoinOrderLimitResult(rows: unknown[]) {
  return {
    from: mockFn(() => ({
      innerJoin: mockFn(() => ({
        where: mockFn(() => ({
          orderBy: mockFn(() => ({
            limit: mockResolved(rows),
          })),
        })),
      })),
    })),
  };
}

type CircleSupportPersonRow = typeof circleSupportPeople.$inferSelect;
type CircleCareTeamPersonRow = typeof circleCareTeamPeople.$inferSelect;
type CircleCareTeamAppointmentRow = typeof circleCareTeamAppointments.$inferSelect;
