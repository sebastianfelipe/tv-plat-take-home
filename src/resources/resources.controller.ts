import type { NextFunction, Request, Response } from 'express';
import { ResourcesService } from './resources.service';

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

  findResources = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const resources = await this.service.findResources();
      res.json(resources);
    } catch (err) {
      next(err);
    }
  };

  findRecentResources = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const resources = await this.service.findResources({
        limit: 10,
        orderBy: 'created_at desc',
      });
      res.json(resources);
    } catch (err) {
      next(err);
    }
  };
}
