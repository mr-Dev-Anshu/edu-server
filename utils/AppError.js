export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes handled errors from crashes
    Error.captureStackTrace(this, this.constructor);
  }
}