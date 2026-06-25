import type { Pool } from 'pg';
import { pool } from '../db';
import type { FindResourcesOrderField, FindResourcesParams, ResourceRow } from './resources.types';

const ORDER_FIELDS: Record<FindResourcesOrderField, string> = {
  id: 'id',
  created_at: 'created_at',
};

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
  async findResources(params: FindResourcesParams = {}): Promise<ResourceRow[]> {
    const sqlParams: unknown[] = [];
    const conditions: string[] = [];

    if (params.where?.ownerId !== undefined) {
      sqlParams.push(params.where.ownerId);
      conditions.push(`owner_id = $${sqlParams.length}`);
    }
    if (params.where?.type !== undefined) {
      sqlParams.push(params.where.type);
      conditions.push(`type = $${sqlParams.length}`);
    }
    if (params.where?.status !== undefined) {
      sqlParams.push(params.where.status);
      conditions.push(`status = $${sqlParams.length}`);
    }

    let sql = `
    SELECT id, owner_id, type, status, title, created_at, updated_at
    FROM resources
  `;

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (params.order) {
      const field = ORDER_FIELDS[params.order.field as FindResourcesOrderField];
      const direction = params.order.direction === 'asc' ? 'ASC' : 'DESC';
      sql += ` ORDER BY ${field} ${direction}`;
    }

    if (params.limit !== undefined) {
      sqlParams.push(params.limit);
      sql += ` LIMIT $${sqlParams.length}`;
    }

    if (params.skip !== undefined) {
      sqlParams.push(params.skip);
      sql += ` OFFSET $${sqlParams.length}`;
    }

    const result = await this.db.query<ResourceRow>(sql, sqlParams);
    return result.rows;
  }
}

export const resourcesRepository = ResourcesRepository.getInstance();
