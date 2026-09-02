// Central error handler — keeps error responses consistent and avoids
// leaking stack traces / internals to the client in production.
function errorHandler(err, req, res, next) {
  console.error(err);

  // Multer surfaces upload problems (file too large, wrong field, etc.)
  // with its own error shape — translate those into clean 400s.
  if (err.name === "MulterError") {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  // CORS rejections thrown by the cors() origin callback in config/cors.js
  if (err.message && err.message.includes("not allowed by CORS")) {
    return res.status(403).json({ error: "This origin is not permitted to access the API." });
  }

  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "Something went wrong. Please try again."
      : err.message;

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
