const { AppError } = require('../utils/app-error');

const notFound = (request, _response, next) => {
  next(new AppError(404, `Route ${request.method} ${request.originalUrl} was not found.`));
};

module.exports = { notFound };
