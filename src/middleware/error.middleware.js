
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  res.status(status).type("application/problem+json").json({
    type: "about:blank",
    title: status === 500 ? "Internal Server Error" : "Request Error",
    status: status,
    detail:
      status === 500
        ? "An unexpected error occurred."
        : err.message,
    instance: req.originalUrl
  });
}

module.exports = errorHandler;
