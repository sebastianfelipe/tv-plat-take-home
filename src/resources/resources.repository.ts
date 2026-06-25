import type { Pool } from 'pg';
import { pool } from '../db';
import type { FindResourcesOpts, ResourceRow } from './resources.types';

export class ResourcesRepository {
  private static instance: ResourcesRepository | undefined;

  private constructor(private readonly db: Pool) {}

  static getInstance(db: Pool = pool): ResourcesRepository {
    if (!ResourcesRepository.instance) {
      ResourcesRepository.instance = new ResourcesRepository(db);
    }
    return ResourcesRepository.instance;
  }

  // SHARED PATH — used by multiple endpoints. Changing this affects all callers.
  //
  // There is NO access control here: every caller sees every resource it asks
  // for, regardless of who is making the request. The auth stub populates
  // req.userId but it never reaches this function.
  async findResources(opts: FindResourcesOpts = {}): Promise<ResourceRow[]> {
    const params: unknown[] = [];
    let sql = `
    SELECT id, owner_id, type, status, title, created_at, updated_at
    FROM resources
  `;

    if (opts.ownerId !== undefined) {
      params.push(opts.ownerId);
      sql += ` WHERE owner_id = $${params.length}`;
    }

    // orderBy is only ever passed internally (never from request input).
    if (opts.orderBy) {
      sql += ` ORDER BY ${opts.orderBy}`;
    }

    if (opts.limit !== undefined) {
      params.push(opts.limit);
      sql += ` LIMIT $${params.length}`;
    }

    const result = await this.db.query<ResourceRow>(sql, params);
    return result.rows;
  }
}

export const resourcesRepository = ResourcesRepository.getInstance();
