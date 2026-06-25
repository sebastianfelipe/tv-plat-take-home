import type { FindParams, FindQuery } from '../shared/query.types';
import type { ResourcesWhere } from './resources.where.types';

export type FindResourcesOrderField = 'id' | 'created_at';

export interface FindResourcesWhere extends ResourcesWhere {
  ownerId?: number;
}

export type FindResourcesParams = FindParams<FindResourcesWhere>;

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
