import type { FindQuery, OrderDirection } from '../shared/query.types';

export interface ResourcesWhere {
  type?: string;
  status?: string;
}

export type FindResourcesOrderField = 'id' | 'created_at';

export interface FindResourcesOrder {
  field: FindResourcesOrderField;
  direction: OrderDirection;
}

export interface FindResourcesWhere extends ResourcesWhere {
  ownerId?: string;
  /** Member access scope: owned resources plus rows shared via resource_shares. */
  accessScopeUserId?: string;
}

export interface FindResourcesParams {
  where?: FindResourcesWhere;
  limit?: number;
  skip?: number;
  order?: FindResourcesOrder;
}

export type ResourcesFilter = FindQuery<ResourcesWhere>;

export interface AccessScope {
  userId?: string;
}

export interface ResourceRow {
  id: string;
  owner_id: string;
  type: string;
  status: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}
