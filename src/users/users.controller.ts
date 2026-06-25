import type { Request, Response } from 'express';
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

  findUserResources = async (req: Request, res: Response) => {
    // TODO: Add a filter validation process, similar to resources controller (where, limit, skip, order).
    const ownerId = parseUserId(req.params.userId);
    if (ownerId === undefined) {
      res.status(400).json({ error: 'Invalid user id' });
      return;
    }

    const { userId } = req as Request & { userId: string };
    await this.service.authorizeOwner(userId, ownerId);
    const resources = await this.service.findUserResources(ownerId);
    res.json(resources);
  };
}
