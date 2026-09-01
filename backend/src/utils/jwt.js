const jwt = require("jsonwebtoken");

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, phone_number: user.phoneNumber },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d" }
  );
}

module.exports = { signAccessToken, signRefreshToken };
