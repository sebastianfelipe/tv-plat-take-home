import type { NextFunction, Request, Response } from 'express';
import { parseFindQueryFromRequest } from '../shared/query.validation';
import { ResourcesService } from './resources.service';
import { resourcesWhereSchema } from './resources.validation';

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

      const resources = await this.service.findResources(parsed.value);
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
