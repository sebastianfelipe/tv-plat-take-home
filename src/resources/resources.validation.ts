import Joi from 'joi';
import type { ResourcesWhere } from './resources.where.types';

export const resourcesWhereSchema = Joi.object<ResourcesWhere>({
  type: Joi.string().valid('doc', 'sheet', 'slide'),
  status: Joi.string().valid('draft', 'published', 'archived'),
});
