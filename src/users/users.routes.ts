import type { Express } from 'express';
import { asyncHandler } from '../middleware/async-handler';
import { requireAuth } from '../middleware/auth';
import { UsersController } from './users.controller';

export function registerUsersRoutes(app: Express): void {
  const controller = UsersController.getInstance();

  // GET /users/:userId/resources
  // Caller #3 of the shared findResources path (owner-only filter, no shares).
  app.get('/users/:userId/resources', requireAuth, asyncHandler(controller.findUserResources));
}
