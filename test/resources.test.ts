import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../scripts/migrate';
import { seed } from '../scripts/seed';
import { createApp } from '../src/app';
import { pool } from '../src/db';

const app = createApp();

const authedGet = (path: string) => request(app).get(path).set('x-user-id', '1');

beforeAll(async () => {
  // Boot against the docker Postgres: apply migrations, then reset + seed.
  await migrate();
  await seed();
});

afterAll(async () => {
  await pool.end();
});

describe('GET /resources', () => {
  it('returns 401 without x-user-id header', async () => {
    const res = await request(app).get('/resources');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('returns 401 when x-user-id is valid but user does not exist', async () => {
    const res = await request(app).get('/resources').set('x-user-id', '9007199254740992');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('returns the full seeded set of resources for admin', async () => {
    const res = await authedGet('/resources');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(30);
  });

  it('returns only owned resources for member', async () => {
    const res = await request(app).get('/resources').set('x-user-id', '2');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(8);
    expect(res.body.every((r: { owner_id: string }) => r.owner_id === '2')).toBe(true);
  });

  it('filters by where, paginates, and orders validated query params', async () => {
    const res = await authedGet('/resources')
      .query({
        where: JSON.stringify({ type: 'doc', status: 'draft' }),
        limit: 5,
        order: JSON.stringify({ field: 'id', direction: 'asc' }),
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(5);
    expect(res.body.every((r: { type: string; status: string }) => r.type === 'doc')).toBe(true);
    expect(res.body.every((r: { status: string }) => r.status === 'draft')).toBe(true);
  });

  it('paginates with skip', async () => {
    const order = JSON.stringify({ field: 'id', direction: 'asc' });
    const firstPage = await authedGet('/resources').query({ limit: 5, order });
    const secondPage = await authedGet('/resources')
      .query({ limit: 5, skip: 5, order });

    expect(firstPage.status).toBe(200);
    expect(secondPage.status).toBe(200);
    expect(firstPage.body[0].id).not.toBe(secondPage.body[0].id);
  });

  it('returns 400 for an unsupported order field', async () => {
    const res = await authedGet('/resources')
      .query({ order: JSON.stringify({ field: 'title', direction: 'asc' }) });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid query parameters');
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it('returns 400 for invalid query parameters', async () => {
    const res = await authedGet('/resources').query({
      where: 'not-json',
      limit: 0,
      order: 'not-json',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid query parameters');
    expect(res.body.details.length).toBeGreaterThan(0);
  });
});

describe('GET /resources/recent', () => {
  it('returns 401 without x-user-id header', async () => {
    const res = await request(app).get('/resources/recent');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('returns 10 most recent resources for admin', async () => {
    const res = await authedGet('/resources/recent');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(10);
    expect(res.body[0].id).toBe('30');
  });

  it('returns only owned recent resources for member', async () => {
    const res = await request(app).get('/resources/recent').set('x-user-id', '2');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(8);
    expect(res.body.every((r: { owner_id: string }) => r.owner_id === '2')).toBe(true);
    expect(res.body[0].id).toBe('30');
  });
});
