import type { NextFunction, Request, Response } from 'express';
import { parseUserId } from '../middleware/auth';
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
      // TODO: Add a filter validation process, similar to resources controller (where, limit, skip, order).
      const ownerId = parseUserId(req.params.userId);
      if (ownerId === undefined) {
        res.status(400).json({ error: 'Invalid user id' });
        return;
      }

      const resources = await this.service.findUserResources(ownerId);
      res.json(resources);
    } catch (err) {
      next(err);
    }
  };
}
