class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    this.code = typeof details === 'string' ? details : (details?.code || undefined);
    this.isOperational = true;
  }
}

module.exports = { AppError };
