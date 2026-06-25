import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrate } from '../scripts/migrate';
import { seed } from '../scripts/seed';
import { createApp } from '../src/app';
import { pool } from '../src/db';
import type { ResourcesService } from '../src/resources/resources.service';
import { ForbiddenError, NotFoundError } from '../src/shared/errors';
import type { UsersRepository } from '../src/users/users.repository';
import { UsersService } from '../src/users/users.service';
import { UserRole } from '../src/users/users.types';

const app = createApp();

function createUsersService(role: UserRole | undefined): UsersService {
  const usersRepository = {
    findById: vi
      .fn()
      .mockResolvedValue(role === undefined ? undefined : { id: '1', name: 'Test', role }),
  } as unknown as UsersRepository;

  const resourcesService = {
    findResourcesByOwner: vi.fn(),
  } as unknown as ResourcesService;

  return UsersService.getInstance(resourcesService, usersRepository);
}

beforeAll(async () => {
  await migrate();
  await seed();
});

afterAll(async () => {
  await pool.end();
});

describe('UsersService.authorizeOwner', () => {
  beforeEach(() => {
    (UsersService as unknown as { instance: UsersService | undefined }).instance = undefined;
  });

  it('allows admin regardless of ownerId', async () => {
    const service = createUsersService(UserRole.Admin);
    await expect(service.authorizeOwner('1', '99')).resolves.toBeUndefined();
  });

  it('allows member when userId matches ownerId', async () => {
    const service = createUsersService(UserRole.Member);
    await expect(service.authorizeOwner('2', '2')).resolves.toBeUndefined();
  });

  it('forbids member when userId differs from ownerId', async () => {
    const service = createUsersService(UserRole.Member);
    await expect(service.authorizeOwner('2', '3')).rejects.toThrow(ForbiddenError);
  });

  it('forbids when user does not exist', async () => {
    const service = createUsersService(undefined);
    await expect(service.authorizeOwner('2', '2')).rejects.toThrow(ForbiddenError);
  });
});

describe('UsersService.findUserResources', () => {
  beforeEach(() => {
    (UsersService as unknown as { instance: UsersService | undefined }).instance = undefined;
  });

  it('throws not found when owner does not exist', async () => {
    const usersRepository = {
      findById: vi.fn().mockResolvedValue(undefined),
    } as unknown as UsersRepository;
    const resourcesService = {
      findResourcesByOwner: vi.fn(),
    } as unknown as ResourcesService;
    const service = UsersService.getInstance(resourcesService, usersRepository);

    await expect(service.findUserResources('99')).rejects.toThrow(NotFoundError);
    expect(resourcesService.findResourcesByOwner).not.toHaveBeenCalled();
  });

  it('loads resources when owner exists', async () => {
    const resources = [{ id: '1', owner_id: '2' }];
    const usersRepository = {
      findById: vi.fn().mockResolvedValue({ id: '2', name: 'Bob', role: UserRole.Member }),
    } as unknown as UsersRepository;
    const resourcesService = {
      findResourcesByOwner: vi.fn().mockResolvedValue(resources),
    } as unknown as ResourcesService;
    const service = UsersService.getInstance(resourcesService, usersRepository);

    await expect(service.findUserResources('2')).resolves.toEqual(resources);
    expect(resourcesService.findResourcesByOwner).toHaveBeenCalledWith('2');
  });
});

describe('GET /users/:userId/resources', () => {
  beforeAll(() => {
    (UsersService as unknown as { instance: UsersService | undefined }).instance = undefined;
    UsersService.getInstance();
  });

  it('returns 401 without x-user-id header', async () => {
    const res = await request(app).get('/users/1/resources');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('returns 401 when x-user-id is not a valid number', async () => {
    const res = await request(app).get('/users/1/resources').set('x-user-id', 'not-a-user');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('returns 401 when x-user-id is valid but user does not exist', async () => {
    const res = await request(app).get('/users/1/resources').set('x-user-id', '9007199254740992');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });
});
