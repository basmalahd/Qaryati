'use strict';

// Writes an RFC 9457-style problem response. Used by middleware that answers directly
// (authenticate/authorize) so auth failures share the API-wide error format.
function sendProblem(req, res, status, title, detail, errorCode) {
  res.status(status);
  if (typeof res.type === 'function') res.type('application/problem+json');
  return res.json({
    type: 'about:blank',
    title,
    status,
    detail,
    instance: req.originalUrl,
    error_code: errorCode,
    message: detail, // kept for older clients/tests that read `message`
  });
}

module.exports = { sendProblem };
