declare global {
  namespace Express {
    interface Request {
      // Decimal string — matches postgres bigint via pg driver (see auth.ts).
      userId?: string;
    }
  }
}

export {};
