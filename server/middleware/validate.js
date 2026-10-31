const AppError = require("../utils/AppError");

/**
 * Validates req[source] against a zod schema and replaces it with the parsed value.
 * req.query is read-only in Express 5, so parsed query data is stored on req.validatedQuery.
 */
const validate =
  (schema, source = "body") =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || source,
        message: issue.message,
      }));
      throw new AppError(errors[0].message, 400, errors);
    }
    if (source === "query") req.validatedQuery = result.data;
    else req[source] = result.data;
    next();
  };

module.exports = validate;
