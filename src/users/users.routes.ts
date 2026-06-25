import type { Express } from 'express';
import { UsersController } from './users.controller';

export function registerUsersRoutes(app: Express): void {
  const controller = UsersController.getInstance();

  // GET /users/:userId/resources
  // Caller #3 of the shared findResources path.
  app.get('/users/:userId/resources', controller.findUserResources);
}
