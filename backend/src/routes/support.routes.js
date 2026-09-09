const express = require("express");
const { submitSupportMessage } = require("../controllers/support.controller");
const validate = require("../middleware/validate");
const { submitSupportMessageSchema } = require("../validators/support.validators");
const { supportLimiter } = require("../middleware/rateLimit");

const router = express.Router();

router.post("/", supportLimiter, validate(submitSupportMessageSchema), submitSupportMessage);

module.exports = router;
