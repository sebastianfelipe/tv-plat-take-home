export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export class ForbiddenError extends HttpError {
  constructor() {
    super(403, 'Forbidden');
  }
}
