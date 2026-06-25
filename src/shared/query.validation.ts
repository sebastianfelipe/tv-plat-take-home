import type { Request } from 'express';
import Joi from 'joi';
import type { FindOrder, FindQuery } from './query.types';

const LIMIT_SCHEMA = Joi.number().integer().min(1).max(100);
const SKIP_SCHEMA = Joi.number().integer().min(0);

const ORDER_SCHEMA = Joi.object<FindOrder>({
  field: Joi.string().required(),
  direction: Joi.string().valid('asc', 'desc').required(),
});

export type ParseFindQueryResult<TWhere> =
  | { ok: true; value: FindQuery<TWhere> }
  | { ok: false; errors: string[] };

export function parseFindQueryFromRequest<TWhere>(
  query: Request['query'],
  whereSchema: Joi.ObjectSchema<TWhere>,
): ParseFindQueryResult<TWhere> {
  const errors: string[] = [];
  const value: FindQuery<TWhere> = {};
  const joiOptions = { convert: true, abortEarly: false };

  if (query.limit !== undefined) {
    const { error, value: limit } = LIMIT_SCHEMA.validate(query.limit, joiOptions);
    if (error) {
      errors.push(...error.details.map((detail) => detail.message));
    } else {
      value.limit = limit;
    }
  }

  if (query.skip !== undefined) {
    const { error, value: skip } = SKIP_SCHEMA.validate(query.skip, joiOptions);
    if (error) {
      errors.push(...error.details.map((detail) => detail.message));
    } else {
      value.skip = skip;
    }
  }

  if (query.order !== undefined) {
    if (typeof query.order !== 'string') {
      errors.push('order must be a JSON string');
    } else {
      try {
        const parsedOrder: unknown = JSON.parse(query.order);
        const { error, value: order } = ORDER_SCHEMA.validate(parsedOrder, joiOptions);
        if (error) {
          errors.push(...error.details.map((detail) => detail.message));
        } else {
          value.order = order;
        }
      } catch {
        errors.push('order must be valid JSON');
      }
    }
  }

  if (query.where !== undefined) {
    if (typeof query.where !== 'string') {
      errors.push('where must be a JSON string');
    } else {
      try {
        const parsedWhere: unknown = JSON.parse(query.where);
        const { error, value: where } = whereSchema.validate(parsedWhere, joiOptions);
        if (error) {
          errors.push(...error.details.map((detail) => detail.message));
        } else {
          value.where = where;
        }
      } catch {
        errors.push('where must be valid JSON');
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value };
}
