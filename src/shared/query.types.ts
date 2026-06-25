export type OrderDirection = 'asc' | 'desc';

export interface FindQuery<TWhere = Record<string, unknown>> {
  where?: TWhere;
  limit?: number;
  orderBy?: OrderDirection;
}
