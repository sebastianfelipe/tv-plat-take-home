import type { Express } from 'express';
import { ResourcesController } from './resources.controller';

export function registerResourcesRoutes(app: Express): void {
  const controller = ResourcesController.getInstance();

  // GET /resources
  // Caller #1 of the shared findResources path.
  // Returns ALL resources — no filtering, no pagination, no input validation.
  // (See CHALLENGE.md, task 1.)
  app.get('/resources', controller.findResources);

  // GET /resources/recent
  // Caller #2 of the shared findResources path.
  app.get('/resources/recent', controller.findRecentResources);
}
