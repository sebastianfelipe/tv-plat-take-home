import type { NextFunction, Request, Response } from 'express';
import { findResources } from '../resources/resources.service';

export async function findUserResources(req: Request, res: Response, next: NextFunction) {
  try {
    const ownerId = Number(req.params.userId);
    const resources = await findResources({ ownerId });
    res.json(resources);
  } catch (err) {
    next(err);
  }
}
