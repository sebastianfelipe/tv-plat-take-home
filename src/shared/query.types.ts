export type OrderDirection = 'asc' | 'desc';

export interface FindOrder {
  field: string;
  direction: OrderDirection;
}

export interface FindQuery<TWhere = Record<string, unknown>> {
  where?: TWhere;
  limit?: number;
  skip?: number;
  order?: FindOrder;
}

export interface FindParams<TWhere> {
  where?: TWhere;
  limit?: number;
  skip?: number;
  order?: FindOrder;
}

export function buildFindParams<TWhere>(query?: FindQuery<TWhere>): FindParams<TWhere> {
  if (!query) {
    return {};
  }

  const params: FindParams<TWhere> = {};

  if (query.where !== undefined) {
    params.where = query.where;
  }

  if (query.limit !== undefined) {
    params.limit = query.limit;
  }

  if (query.skip !== undefined) {
    params.skip = query.skip;
  }

  if (query.order !== undefined) {
    params.order = query.order;
  }

  return params;
}
