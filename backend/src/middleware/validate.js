/**
 * Wraps a Zod schema as Express middleware.
 * On failure, responds 400 with a clear list of what's wrong instead of
 * letting bad input reach Prisma (where it becomes an ugly 500 error).
 *
 * `source` selects which part of the request to validate — "body" (default)
 * or "query" for GET requests with filter/search params.
 */
function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return res.status(400).json({ error: "Validation failed", issues });
    }

    // Replace with the parsed/typed data (e.g. query strings coerced to numbers)
    req[source] = result.data;
    next();
  };
}

module.exports = validate;
