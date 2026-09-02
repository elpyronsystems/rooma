/**
 * Builds CORS options that only allow requests from origins explicitly
 * listed in ALLOWED_ORIGINS (comma-separated in .env). Replaces a bare
 * cors() call, which by default allows every origin — fine for early
 * local testing, not something to ship with real user data behind it.
 */
function buildCorsOptions() {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  return {
    origin(origin, callback) {
      // `origin` is undefined for non-browser requests (curl, Postman,
      // server-to-server calls, mobile apps using plain HTTP clients) —
      // those aren't subject to the browser same-origin model, so allow them.
      if (!origin) return callback(null, true);

      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  };
}

module.exports = buildCorsOptions;
