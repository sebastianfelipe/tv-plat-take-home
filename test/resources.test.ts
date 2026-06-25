import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../scripts/migrate';
import { seed } from '../scripts/seed';
import { createApp } from '../src/app';
import { pool } from '../src/db';

const app = createApp();

beforeAll(async () => {
  // Boot against the docker Postgres: apply migrations, then reset + seed.
  await migrate();
  await seed();
});

afterAll(async () => {
  await pool.end();
});

describe('GET /resources', () => {
  it('returns the full seeded set of resources', async () => {
    const res = await request(app).get('/resources');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(30);
  });

  it('accepts validated where, limit, and orderBy query params', async () => {
    const res = await request(app)
      .get('/resources')
      .query({
        where: JSON.stringify({ type: 'doc', status: 'draft' }),
        limit: 5,
        orderBy: 'asc',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(30);
  });

  it('returns 400 for invalid query parameters', async () => {
    const res = await request(app).get('/resources').query({
      where: 'not-json',
      limit: 0,
      orderBy: 'sideways',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid query parameters');
    expect(res.body.details.length).toBeGreaterThan(0);
  });
});
