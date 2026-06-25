import type { FindQuery, OrderDirection } from '../shared/query.types';

export interface ResourcesWhere {
  type?: 'doc' | 'sheet' | 'slide';
  status?: 'draft' | 'published' | 'archived';
}

export type FindResourcesOrderField = 'id' | 'created_at';

export interface FindResourcesOrder {
  field: FindResourcesOrderField;
  direction: OrderDirection;
}

export interface FindResourcesWhere extends ResourcesWhere {
  ownerId?: number;
}

export interface FindResourcesParams {
  where?: FindResourcesWhere;
  limit?: number;
  skip?: number;
  order?: FindResourcesOrder;
}

export type ResourcesFilter = FindQuery<ResourcesWhere>;

export interface ResourceRow {
  id: string;
  owner_id: string;
  type: string;
  status: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}
