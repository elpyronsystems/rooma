const rateLimit = require("express-rate-limit");

// A 6-digit OTP has 1,000,000 possible values — without a limit, an
// attacker could brute-force it directly against this endpoint.
// 10 attempts per 15 minutes per IP is generous for a real user, brutal
// for someone guessing.
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many verification attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Same logic for login — protects against password-guessing.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Lighter general limiter for signup — mainly to slow down mass
// automated account creation, not a legitimate-user concern.
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: "Too many signup attempts from this IP. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { otpLimiter, loginLimiter, signupLimiter };
