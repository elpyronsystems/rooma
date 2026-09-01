// Central error handler — keeps error responses consistent and avoids
// leaking stack traces / internals to the client in production.
function errorHandler(err, req, res, next) {
  console.error(err);

  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "Something went wrong. Please try again."
      : err.message;

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
