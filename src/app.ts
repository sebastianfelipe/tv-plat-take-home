import express from 'express';
import { authStub } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { registerResourcesRoutes } from './resources/resources.routes';
import { registerUsersRoutes } from './users/users.routes';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(authStub);

  registerResourcesRoutes(app);
  registerUsersRoutes(app);
  app.use(errorHandler);

  return app;
}
