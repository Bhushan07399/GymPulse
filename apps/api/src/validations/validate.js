const { AppError } = require('../utils/app-error');

const validate = (schema) => (request, _response, next) => {
  const result = schema.safeParse({
    body: request.body,
    params: request.params,
    query: request.query
  });

  if (!result.success) {
    return next(new AppError(400, 'Request validation failed.', result.error.flatten()));
  }

  request.validated = result.data;
  return next();
};

module.exports = { validate };
