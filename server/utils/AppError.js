/** Error carrying an HTTP status and optional field errors; rendered by the error handler. */
class AppError extends Error {
  constructor(message, statusCode = 400, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
}

module.exports = AppError;
