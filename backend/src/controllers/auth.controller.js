const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { signAccessToken, signRefreshToken } = require("../utils/jwt");

// Generates a 6-digit numeric code for SMS MFA.
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * POST /api/auth/signup
 * Creates a user and issues an SMS verification code.
 * NOTE: actual SMS sending via Hubtel is a TODO — see comment below.
 */
async function signup(req, res, next) {
  try {
    const { fullName, phoneNumber, email, password, role } = req.body;

    if (!fullName || !phoneNumber || !password) {
      return res.status(400).json({ error: "fullName, phoneNumber, and password are required" });
    }

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
async function login(req, res, next) {
  try {
    const { phoneNumber, password } = req.body;

    const user = await prisma.user.findUnique({ where: { phoneNumber } });
    if (!user) {
      return res.status(401).json({ error: "Invalid phone number or password" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid phone number or password" });
    }

    if (!user.phoneVerified) {
      return res.status(403).json({ error: "Please verify your phone number before logging in" });
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

module.exports = { signup, verifyOtp, login };
