'use strict';

const { ProblemError } = require('../shared/http/problem');

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = Number.isInteger(err.status) && err.status >= 400 && err.status <= 599
    ? err.status
    : Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode <= 599
      ? err.statusCode
      : 500;

  const isProblem = err instanceof ProblemError;
  const body = {
    type: 'about:blank',
    title: isProblem ? err.title : (status === 404 ? 'Not Found' : status === 400 ? 'Bad Request' : status === 500 ? 'Internal Server Error' : 'Request Error'),
    status,
    detail: status >= 500 && !isProblem ? 'An unexpected error occurred.' : (err.detail || err.message || 'The request could not be completed.'),
    instance: req.originalUrl,
    error_code: isProblem ? err.errorCode : (status === 404 ? 'RESOURCE_NOT_FOUND' : status === 400 ? 'BAD_REQUEST' : 'REQUEST_FAILED')
  };

  if (isProblem && err.errors !== undefined) body.errors = err.errors;

  return res.status(status).type('application/problem+json').json(body);
}

module.exports = errorHandler;
