const express = require("express");
const { signup, verifyOtp, login } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);

module.exports = router;
