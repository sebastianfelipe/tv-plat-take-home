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
  // Access scoping is applied via `where.accessScopeUserId` (owned + shared) or
  // `where.ownerId` (owner-only). Callers that need user-scoped visibility must
  // pass the appropriate where clause from the service layer.
  async findResources(params: FindResourcesParams = {}): Promise<ResourceRow[]> {
    const sqlParams: unknown[] = [];
    const conditions: string[] = [];

    const { where, limit, skip, order } = params;
    if (where?.accessScopeUserId !== undefined) {
      sqlParams.push(where.accessScopeUserId);
      const userParam = `$${sqlParams.length}`;
      conditions.push(`(
        owner_id = ${userParam}
        OR EXISTS (
          SELECT 1
          FROM resource_shares rs
          WHERE rs.resource_id = resources.id
            AND rs.user_id = ${userParam}
        )
      )`);
    } else if (where?.ownerId !== undefined) {
      sqlParams.push(where.ownerId);
      conditions.push(`owner_id = $${sqlParams.length}`);
    }
    if (where?.type !== undefined) {
      sqlParams.push(where.type);
      conditions.push(`type = $${sqlParams.length}`);
    }
    if (where?.status !== undefined) {
      sqlParams.push(where.status);
      conditions.push(`status = $${sqlParams.length}`);
    }

    let sql = `
    SELECT id, owner_id, type, status, title, created_at, updated_at
    FROM resources
  `;

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (order) {
      const field = ORDER_FIELDS[order.field];
      const direction = order.direction === 'asc' ? 'ASC' : 'DESC';
      sql += ` ORDER BY ${field} ${direction}`;
    }

    if (limit !== undefined) {
      sqlParams.push(limit);
      sql += ` LIMIT $${sqlParams.length}`;
    }

    if (skip !== undefined) {
      sqlParams.push(skip);
      sql += ` OFFSET $${sqlParams.length}`;
    }

    const result = await this.db.query<ResourceRow>(sql, sqlParams);
    return result.rows;
  }
}

export const resourcesRepository = ResourcesRepository.getInstance();
