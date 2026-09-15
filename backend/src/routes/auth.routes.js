const express = require("express");
const { signup, adminSignup, verifyOtp, login, refresh, oauthLogin } = require("../controllers/auth.controller");
const validate = require("../middleware/validate");
const { signupSchema, adminSignupSchema, verifyOtpSchema, loginSchema } = require("../validators/auth.validators");
const { otpLimiter, loginLimiter, signupLimiter } = require("../middleware/rateLimit");

const router = express.Router();

router.post("/signup", signupLimiter, validate(signupSchema), signup);
router.post("/admin-signup", signupLimiter, validate(adminSignupSchema), adminSignup);
router.post("/verify-otp", otpLimiter, validate(verifyOtpSchema), verifyOtp);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/oauth", loginLimiter, oauthLogin);
router.post("/refresh", refresh);

module.exports = router;
