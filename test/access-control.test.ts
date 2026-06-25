import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../scripts/migrate';
import { seed } from '../scripts/seed';
import { createApp } from '../src/app';
import { pool } from '../src/db';

const app = createApp();

const ADMIN_ID = '1';
const MEMBER_ID = '2';
const TOTAL_RESOURCES = 30;
const OWNED_COUNT: Record<string, number> = {
  '1': 8,
  '2': 8,
  '3': 7,
  '4': 7,
};

const authedGet = (userId: string, path: string) =>
  request(app).get(path).set('x-user-id', userId);

beforeAll(async () => {
  await migrate();
  await seed();
});

afterAll(async () => {
  await pool.end();
});

describe('access control — admin global lists', () => {
  it('lists all resources on GET /resources', async () => {
    const res = await authedGet(ADMIN_ID, '/resources');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(TOTAL_RESOURCES);
    expect(new Set(res.body.map((r: { owner_id: string }) => r.owner_id)).size).toBeGreaterThan(1);
  });

  it('lists the 10 most recent resources globally on GET /resources/recent', async () => {
    const res = await authedGet(ADMIN_ID, '/resources/recent');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(10);
    expect(res.body[0].id).toBe('30');
    expect(new Set(res.body.map((r: { owner_id: string }) => r.owner_id)).size).toBeGreaterThan(1);
  });
});

describe('access control — member scoped lists', () => {
  it('lists only owned resources on GET /resources', async () => {
    const res = await authedGet(MEMBER_ID, '/resources');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(OWNED_COUNT[MEMBER_ID]);
    expect(res.body.every((r: { owner_id: string }) => r.owner_id === MEMBER_ID)).toBe(true);
  });

  it('lists only owned recent resources on GET /resources/recent', async () => {
    const res = await authedGet(MEMBER_ID, '/resources/recent');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(OWNED_COUNT[MEMBER_ID]);
    expect(res.body.every((r: { owner_id: string }) => r.owner_id === MEMBER_ID)).toBe(true);
    expect(res.body[0].id).toBe('30');
  });

  it('scopes query filters to owned resources on GET /resources', async () => {
    const where = JSON.stringify({ type: 'doc' });
    const adminRes = await authedGet(ADMIN_ID, '/resources').query({ where });
    const memberRes = await authedGet(MEMBER_ID, '/resources').query({ where });

    expect(adminRes.status).toBe(200);
    expect(memberRes.status).toBe(200);
    expect(adminRes.body.length).toBeGreaterThan(memberRes.body.length);
    expect(memberRes.body.every((r: { owner_id: string }) => r.owner_id === MEMBER_ID)).toBe(true);
  });
});

describe('access control — admin user resources', () => {
  it('accesses another user resources on GET /users/:userId/resources', async () => {
    const res = await authedGet(ADMIN_ID, '/users/3/resources');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(OWNED_COUNT['3']);
    expect(res.body.every((r: { owner_id: string }) => r.owner_id === '3')).toBe(true);
  });

  it('accesses its own resources on GET /users/:userId/resources', async () => {
    const res = await authedGet(ADMIN_ID, '/users/1/resources');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(OWNED_COUNT[ADMIN_ID]);
    expect(res.body.every((r: { owner_id: string }) => r.owner_id === ADMIN_ID)).toBe(true);
  });

  it('returns 404 when the requested user does not exist', async () => {
    const res = await authedGet(ADMIN_ID, '/users/9007199254740992/resources');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });
});

describe('access control — member user resources', () => {
  it('accesses own resources on GET /users/:userId/resources', async () => {
    const res = await authedGet(MEMBER_ID, '/users/2/resources');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(OWNED_COUNT[MEMBER_ID]);
    expect(res.body.every((r: { owner_id: string }) => r.owner_id === MEMBER_ID)).toBe(true);
  });

  it('forbids access to another user resources on GET /users/:userId/resources', async () => {
    const res = await authedGet(MEMBER_ID, '/users/3/resources');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });
});
