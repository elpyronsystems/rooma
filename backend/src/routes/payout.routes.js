const express = require("express");
const { getMyPayoutSettings, updateMyPayoutSettings } = require("../controllers/payout.controller");
const { requireAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { payoutSettingsSchema } = require("../validators/payout.validators");

const router = express.Router();

router.get("/me", requireAuth, getMyPayoutSettings);
router.patch("/me", requireAuth, validate(payoutSettingsSchema), updateMyPayoutSettings);

module.exports = router;
