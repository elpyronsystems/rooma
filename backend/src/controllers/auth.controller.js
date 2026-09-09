const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { signAccessToken, signRefreshToken } = require("../utils/jwt");

// Generates a 6-digit numeric code for SMS MFA.
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * POST /api/auth/signup
 * Creates a user and issues a verification code.
 * NOTE: actual SMS sending via Hubtel is a TODO — until it's connected,
 * codes are retrieved directly from the database (Prisma Studio →
 * SmsVerification table) by whoever's helping a user get verified.
 */
async function signup(req, res, next) {
  try {
    const { fullName, phoneNumber, email, password, role } = req.body;
    // Input shape/format is already guaranteed valid by the signupSchema
    // Zod validation middleware — no need to re-check presence here.
    // Note: the schema intentionally excludes "admin" from allowed roles,
    // so this can never be used to self-assign admin access.

    const existing = await prisma.user.findUnique({ where: { phoneNumber } });
    if (existing) {
      return res.status(409).json({ error: "An account with this phone number already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        phoneNumber,
        email,
        passwordHash,
        role: role || "seeker",
      },
    });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.smsVerification.create({
      data: { userId: user.id, code, purpose: "signup", expiresAt },
    });

    // TODO: send `code` via Hubtel SMS Gateway to user.phoneNumber
    // await hubtelClient.sendSms(user.phoneNumber, `Your Rooma verification code is ${code}`);

    res.status(201).json({
      message: "Signup successful. Enter the SMS code sent to your phone to verify your account.",
      userId: user.id,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/admin-signup
 * Same shape as regular signup, but requires a shared access code and
 * always creates the account with role "admin". Kept as a fully
 * separate endpoint/schema from the regular signup (rather than an
 * extra field on it) specifically so admin role assignment is never
 * reachable through the normal signup path, even by a tampered request
 * body.
 *
 * Note on the access code itself: it's checked here server-side, which
 * is the real enforcement — but it's also compiled into the public
 * frontend bundle for the "reveal the admin entry form" step, so it's
 * not a secret once the site ships. Treat it as a low-friction gate
 * against casual discovery, not a cryptographic boundary; rotate
 * ADMIN_ACCESS_CODE periodically and share it only with people who
 * should be able to self-provision an admin account.
 */
async function adminSignup(req, res, next) {
  try {
    const { fullName, phoneNumber, email, password, accessCode } = req.body;

    if (accessCode !== process.env.ADMIN_ACCESS_CODE) {
      return res.status(403).json({ error: "Invalid access code" });
    }

    const existing = await prisma.user.findUnique({ where: { phoneNumber } });
    if (existing) {
      return res.status(409).json({ error: "An account with this phone number already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { fullName, phoneNumber, email, passwordHash, role: "admin" },
    });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.smsVerification.create({
      data: { userId: user.id, code, purpose: "signup", expiresAt },
    });

    res.status(201).json({
      message: "Admin account created. Enter the SMS code sent to your phone to verify your account.",
      userId: user.id,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/verify-otp
 * Confirms the SMS code and marks the user's phone as verified.
 */
async function verifyOtp(req, res, next) {
  try {
    const { userId, code } = req.body;

    const verification = await prisma.smsVerification.findFirst({
      where: { userId, code, verifiedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    if (verification.expiresAt < new Date()) {
      return res.status(400).json({ error: "Verification code has expired" });
    }

    await prisma.$transaction([
      prisma.smsVerification.update({
        where: { id: verification.id },
        data: { verifiedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { phoneVerified: true },
      }),
    ]);

    res.json({ message: "Phone number verified successfully" });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
const PHONE_PATTERN = /^0\d{9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Resolves a login identifier (phone number, email, or full name) to a
 * single User row, or null if none/ambiguous. Phone and email are unique
 * columns, so those always resolve to exactly one user or none. Full name
 * is NOT unique — if more than one account shares that name, this
 * deliberately refuses to guess which one, and the caller shows a message
 * asking the person to log in with phone or email instead.
 */
async function resolveLoginUser(identifier) {
  const trimmed = identifier.trim();

  if (PHONE_PATTERN.test(trimmed)) {
    return { user: await prisma.user.findUnique({ where: { phoneNumber: trimmed } }), ambiguous: false };
  }

  if (EMAIL_PATTERN.test(trimmed)) {
    return { user: await prisma.user.findUnique({ where: { email: trimmed } }), ambiguous: false };
  }

  // Fall back to a full-name lookup — case-insensitive, since people
  // don't reliably remember their own capitalization.
  const matches = await prisma.user.findMany({
    where: { fullName: { equals: trimmed, mode: "insensitive" } },
  });

  if (matches.length === 1) {
    return { user: matches[0], ambiguous: false };
  }
  if (matches.length > 1) {
    return { user: null, ambiguous: true };
  }
  return { user: null, ambiguous: false };
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { identifier, password } = req.body;

    const { user, ambiguous } = await resolveLoginUser(identifier);

    if (ambiguous) {
      return res.status(409).json({
        error: "More than one account shares that name. Please log in with your phone number or email instead.",
      });
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid login details" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid login details" });
    }

    if (!user.phoneVerified) {
      return res.status(403).json({ error: "Please verify your phone number before logging in" });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: "This account has been suspended. Contact support for help." });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh
 * Exchanges a still-valid refresh token for a new access token, so the
 * frontend can silently re-authenticate instead of logging the user out
 * every time the short-lived access token expires (default 1h).
 */
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "refreshToken is required" });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: "Invalid or expired refresh token — please log in again" });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(401).json({ error: "Invalid or expired refresh token — please log in again" });
    }

    const accessToken = signAccessToken(user);
    // Also issue a fresh refresh token — sliding expiration means an
    // active user is never forced to log in again, while a truly
    // abandoned session still expires per JWT_REFRESH_EXPIRES_IN.
    const newRefreshToken = signRefreshToken(user);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, adminSignup, verifyOtp, login, refresh };
