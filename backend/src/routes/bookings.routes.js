const express = require("express");
const {
  createBooking,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  getMyBookings,
  getOwnerBookings,
} = require("../controllers/bookings.controller");
const { initiatePayment, getBookingPayment } = require("../controllers/payments.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createBookingSchema } = require("../validators/bookings.validators");
const { initiatePaymentSchema } = require("../validators/payments.validators");

const router = express.Router();

router.get("/my", requireAuth, getMyBookings);
router.get("/owner", requireAuth, getOwnerBookings);
// Only seekers (and admins, for support purposes) can request a booking —
// landlords/agents/hotel managers are on the confirming side of a booking,
// not the requesting side.
router.post("/", requireAuth, requireRole("seeker", "admin"), validate(createBookingSchema), createBooking);
router.patch("/:id/confirm", requireAuth, confirmBooking);
router.patch("/:id/reject", requireAuth, rejectBooking);
router.patch("/:id/cancel", requireAuth, cancelBooking);
router.post("/:id/payments", requireAuth, validate(initiatePaymentSchema), initiatePayment);
router.get("/:id/payment", requireAuth, getBookingPayment);

module.exports = router;
