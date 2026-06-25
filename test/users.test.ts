import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../scripts/migrate';
import { seed } from '../scripts/seed';
import { createApp } from '../src/app';
import { pool } from '../src/db';

const app = createApp();

beforeAll(async () => {
  await migrate();
  await seed();
});

afterAll(async () => {
  await pool.end();
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

  it('accepts x-user-id values outside Number.MAX_SAFE_INTEGER', async () => {
    const res = await request(app)
      .get('/users/1/resources')
      .set('x-user-id', '9007199254740992');

    expect(res.status).toBe(200);
  });

  it('returns resources owned by the user', async () => {
    const res = await request(app).get('/users/1/resources').set('x-user-id', '1');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((r: { owner_id: string }) => r.owner_id === '1')).toBe(true);
  });
});
