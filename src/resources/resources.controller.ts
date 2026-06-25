import type { NextFunction, Request, Response } from 'express';
import * as resourcesService from './resources.service';

export async function findResources(_req: Request, res: Response, next: NextFunction) {
  try {
    const resources = await resourcesService.findResources();
    res.json(resources);
  } catch (err) {
    next(err);
  }
}

export async function findRecentResources(_req: Request, res: Response, next: NextFunction) {
  try {
    const resources = await resourcesService.findResources({
      limit: 10,
      orderBy: 'created_at desc',
    });
    res.json(resources);
  } catch (err) {
    next(err);
  }
}
