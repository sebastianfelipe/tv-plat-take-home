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

  const { where, limit, skip, order } = query;

  if (where !== undefined) {
    params.where = where;
  }

  if (limit !== undefined) {
    params.limit = limit;
  }

  if (query.skip !== undefined) {
    params.skip = skip;
  }

  if (query.order !== undefined) {
    params.order = order;
  }

  return params;
}
