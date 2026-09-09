const express = require("express");
const {
  createBooking,
  confirmBooking,
  rejectBooking,
  getMyBookings,
  getOwnerBookings,
} = require("../controllers/bookings.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createBookingSchema } = require("../validators/bookings.validators");

const router = express.Router();

router.get("/my", requireAuth, getMyBookings);
router.get("/owner", requireAuth, getOwnerBookings);
// Only seekers (and admins, for support purposes) can request a booking —
// landlords/agents/hotel managers are on the confirming side of a booking,
// not the requesting side.
router.post("/", requireAuth, requireRole("seeker", "admin"), validate(createBookingSchema), createBooking);
router.patch("/:id/confirm", requireAuth, confirmBooking);
router.patch("/:id/reject", requireAuth, rejectBooking);

module.exports = router;
