'use strict';

class ProblemError extends Error {
  constructor(status, title, detail, errorCode = 'REQUEST_FAILED', errors) {
    super(detail || title);
    this.name = 'ProblemError';
    this.status = status;
    this.title = title;
    this.detail = detail || title;
    this.errorCode = errorCode;
    this.errors = errors;
  }
}

const badRequest = (detail, errors) => new ProblemError(400, 'Bad Request', detail, 'VALIDATION_ERROR', errors);
const notFound = (detail = 'The requested resource was not found.') => new ProblemError(404, 'Not Found', detail, 'RESOURCE_NOT_FOUND');
const conflict = (detail, code = 'STATE_CONFLICT') => new ProblemError(409, 'Conflict', detail, code);
const unprocessable = (detail, errors) => new ProblemError(422, 'Unprocessable Content', detail, 'DOMAIN_VALIDATION_FAILED', errors);

module.exports = { ProblemError, badRequest, notFound, conflict, unprocessable };
