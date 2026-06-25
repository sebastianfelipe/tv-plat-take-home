import type { NextFunction, Request, Response } from 'express';
import { parseFindQueryFromRequest } from '../shared/query.validation';
import { ResourcesService } from './resources.service';
import { resourcesOrderSchema, resourcesWhereSchema } from './resources.validation';

export class ResourcesController {
  private static instance: ResourcesController | undefined;

  private constructor(private readonly service: ResourcesService) {}

  static getInstance(service?: ResourcesService): ResourcesController {
    if (!ResourcesController.instance) {
      ResourcesController.instance = new ResourcesController(
        service ?? ResourcesService.getInstance(),
      );
    }
    return ResourcesController.instance;
  }

  findResources = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: Add this process as a middleware function.
      const parsed = parseFindQueryFromRequest(req.query, resourcesWhereSchema);
      if (!parsed.ok) {
        res.status(400).json({ error: 'Invalid query parameters', details: parsed.errors });
        return;
      }

      if (parsed.value.order !== undefined) {
        const { error } = resourcesOrderSchema.validate(parsed.value.order, {
          convert: true,
          abortEarly: false,
        });
        if (error) {
          res.status(400).json({
            error: 'Invalid query parameters',
            details: error.details.map((detail) => detail.message),
          });
          return;
        }
      }

      const filter = parsed.value;
      const { userId } = req as Request & { userId: string };
      const restrictedWhere = await this.service.buildRestrictedWhere(userId);
      const resources = await this.service.findResources(filter, restrictedWhere);
      res.json(resources);
    } catch (err) {
      next(err);
    }
  };

  findRecentResources = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const resources = await this.service.findRecentResources();
      res.json(resources);
    } catch (err) {
      next(err);
    }
  };
}
