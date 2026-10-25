
const { z } = require("zod");

const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      return res.status(400).type("application/problem+json").json({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Request validation failed.",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message
        })),
        instance: req.originalUrl
      });
    }

    req.validated = result.data;
    next();
  };
};

module.exports = validate;
