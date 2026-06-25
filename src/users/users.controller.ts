import type { NextFunction, Request, Response } from 'express';
import { UsersService } from './users.service';

export class UsersController {
  private static instance: UsersController | undefined;

  private constructor(private readonly service: UsersService) {}

  static getInstance(service?: UsersService): UsersController {
    if (!UsersController.instance) {
      UsersController.instance = new UsersController(service ?? UsersService.getInstance());
    }
    return UsersController.instance;
  }

  findUserResources = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ownerId = Number(req.params.userId);
      const resources = await this.service.findUserResources(ownerId);
      res.json(resources);
    } catch (err) {
      next(err);
    }
  };
}
