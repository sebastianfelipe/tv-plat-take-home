import Joi from 'joi';
import type { FindResourcesOrder, ResourcesWhere } from './resources.types';

export const resourcesWhereSchema = Joi.object<ResourcesWhere>({
  type: Joi.string(),
  status: Joi.string(),
});

export const resourcesOrderSchema = Joi.object<FindResourcesOrder>({
  field: Joi.string().valid('id', 'created_at'),
  direction: Joi.string().valid('asc', 'desc'),
});
