const express = require("express");
const { verifyPaymentByReference, confirmManualPayment } = require("../controllers/payments.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/verify/:reference", requireAuth, verifyPaymentByReference);
router.patch("/:id/confirm", requireAuth, requireRole("admin"), confirmManualPayment);

module.exports = router;
