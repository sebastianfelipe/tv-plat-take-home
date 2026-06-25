import type { NextFunction, Request, Response } from 'express';
import './express.types';

// users.id is postgres bigint. JavaScript number cannot represent the full 64-bit
// range safely (Number.MAX_SAFE_INTEGER). Keep ids as decimal strings end-to-end
// so they match pg's default bigint wire format and avoid precision loss.
const USER_ID_PATTERN = /^\d+$/;

export function parseUserId(value: string): string | undefined {
  if (!USER_ID_PATTERN.test(value)) {
    return undefined;
  }

  if (BigInt(value) <= 0n) {
    return undefined;
  }

  return value;
}

// Auth STUB — there is no real authentication here. It reads the `x-user-id`
// header and attaches it to the request when valid.
//
// Sets req.userId if and only if the header is present and parseable as a
// positive bigint id. Otherwise the request continues unsigned — rejection is
// deferred to requireAuth on protected routes.
//
// NOTE: the data layer currently IGNORES req.userId. Wiring it into access
// control is intentionally left undone (see CHALLENGE.md, task 2).
export function authStub(req: Request, _res: Response, next: NextFunction) {
  const xUserId = req.header('x-user-id');
  if (xUserId !== undefined) {
    const userId = parseUserId(xUserId);
    if (userId !== undefined) {
      req.userId = userId;
    }
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Missing or malformed x-user-id leaves req.userId unset — reject here.
  if (req.userId === undefined) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
