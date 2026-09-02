const express = require("express");
const { signup, verifyOtp, login } = require("../controllers/auth.controller");
const validate = require("../middleware/validate");
const { signupSchema, verifyOtpSchema, loginSchema } = require("../validators/auth.validators");
const { otpLimiter, loginLimiter, signupLimiter } = require("../middleware/rateLimit");

const router = express.Router();

router.post("/signup", signupLimiter, validate(signupSchema), signup);
router.post("/verify-otp", otpLimiter, validate(verifyOtpSchema), verifyOtp);
router.post("/login", loginLimiter, validate(loginSchema), login);

module.exports = router;
