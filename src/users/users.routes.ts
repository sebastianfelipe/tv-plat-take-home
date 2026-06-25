import type { Express } from 'express';
import { requireAuth } from '../middleware/auth';
import { UsersController } from './users.controller';

export function registerUsersRoutes(app: Express): void {
  const controller = UsersController.getInstance();

  // GET /users/:userId/resources
  // Caller #3 of the shared findResources path.
  //
  // Assumption (Task 2 scope): auth is enforced here only — this endpoint exposes
  // user-scoped data and is the focus of access-control work. `/resources` and
  // `/resources/recent` remain open for now.
  // TODO: require auth on all endpoints once access control is wired globally.
  app.get('/users/:userId/resources', requireAuth, controller.findUserResources);
}
