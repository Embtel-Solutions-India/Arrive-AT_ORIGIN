export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: unknown[] = [],
  ) {
    super(message);
  }
  static badRequest(m = "Bad request", errors: unknown[] = []) { return new HttpError(400, m, errors); }
  static unauthorized(m = "Authentication required") { return new HttpError(401, m); }
  static forbidden(m = "You do not have permission to do this") { return new HttpError(403, m); }
  static notFound(m = "Not found") { return new HttpError(404, m); }
  static conflict(m = "Conflict") { return new HttpError(409, m); }
}
