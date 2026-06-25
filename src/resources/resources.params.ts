import { buildFindParams } from '../shared/query.types';
import type { FindResourcesParams, ResourcesFilter } from './resources.types';

export function buildFindResourcesParams(filter?: ResourcesFilter): FindResourcesParams {
  return buildFindParams(filter) as FindResourcesParams;
}
