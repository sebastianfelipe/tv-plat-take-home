import type { Express } from 'express';
import { asyncHandler } from '../middleware/async-handler';
import { requireAuth } from '../middleware/auth';
import { ResourcesController } from './resources.controller';

export function registerResourcesRoutes(app: Express): void {
  const controller = ResourcesController.getInstance();

  // GET /resources
  // Caller #1 of the shared findResources path.
  // (See CHALLENGE.md, task 1.)
  app.get('/resources', requireAuth, asyncHandler(controller.findResources));

  // GET /resources/recent
  // Caller #2 of the shared findResources path.
  app.get('/resources/recent', requireAuth, asyncHandler(controller.findRecentResources));
}
