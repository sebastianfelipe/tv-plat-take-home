import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrate } from '../scripts/migrate';
import { seed } from '../scripts/seed';
import { createApp } from '../src/app';
import { pool } from '../src/db';
import type { ResourcesService } from '../src/resources/resources.service';
import type { UsersRepository } from '../src/users/users.repository';
import { ForbiddenError, UsersService } from '../src/users/users.service';
import { UserRole } from '../src/users/users.types';

const app = createApp();

function createUsersService(role: UserRole | undefined): UsersService {
  const usersRepository = {
    findRoleById: vi.fn().mockResolvedValue(role),
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

describe('GET /users/:userId/resources', () => {
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

  it('returns 403 when x-user-id is valid but user does not exist', async () => {
    const res = await request(app)
      .get('/users/1/resources')
      .set('x-user-id', '9007199254740992');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('returns resources owned by the user', async () => {
    const res = await request(app).get('/users/1/resources').set('x-user-id', '1');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((r: { owner_id: string }) => r.owner_id === '1')).toBe(true);
  });

  it('allows admin to access another user resources', async () => {
    const res = await request(app).get('/users/2/resources').set('x-user-id', '1');

    expect(res.status).toBe(200);
    expect(res.body.every((r: { owner_id: string }) => r.owner_id === '2')).toBe(true);
  });

  it('allows member to access their own resources', async () => {
    const res = await request(app).get('/users/2/resources').set('x-user-id', '2');

    expect(res.status).toBe(200);
    expect(res.body.every((r: { owner_id: string }) => r.owner_id === '2')).toBe(true);
  });

  it('returns 403 when member accesses another user resources', async () => {
    const res = await request(app).get('/users/3/resources').set('x-user-id', '2');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });
});
