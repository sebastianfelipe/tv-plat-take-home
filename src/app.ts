import express from 'express';
import { authStub } from './middleware/auth';
import * as resourcesController from './resources/resources.controller';
import * as usersController from './users/users.controller';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(authStub);

  // GET /resources
  // Caller #1 of the shared findResources path.
  // Returns ALL resources — no filtering, no pagination, no input validation.
  // (See CHALLENGE.md, task 1.)
  app.get('/resources', resourcesController.findResources);

  // GET /resources/recent
  // Caller #2 of the shared findResources path.
  app.get('/resources/recent', resourcesController.findRecentResources);

  // GET /users/:userId/resources
  // Caller #3 of the shared findResources path.
  app.get('/users/:userId/resources', usersController.findUserResources);

  return app;
}
