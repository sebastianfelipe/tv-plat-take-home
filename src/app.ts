import express from 'express';
import { authStub } from './middleware/auth';
import { registerResourcesRoutes } from './resources/resources.routes';
import { registerUsersRoutes } from './users/users.routes';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(authStub);

  registerResourcesRoutes(app);
  registerUsersRoutes(app);

  return app;
}
