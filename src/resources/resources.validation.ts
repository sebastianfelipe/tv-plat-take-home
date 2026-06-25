import Joi from 'joi';
import type { FindResourcesOrder, ResourcesWhere } from './resources.types';

export const resourcesWhereSchema = Joi.object<ResourcesWhere>({
  type: Joi.string().valid('doc', 'sheet', 'slide'),
  status: Joi.string().valid('draft', 'published', 'archived'),
});

export const resourcesOrderSchema = Joi.object<FindResourcesOrder>({
  field: Joi.string().valid('id', 'created_at'),
  direction: Joi.string().valid('asc', 'desc'),
});
