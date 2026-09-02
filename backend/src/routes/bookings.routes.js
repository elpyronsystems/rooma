const express = require("express");
const { createBooking, confirmBooking } = require("../controllers/bookings.controller");
const { requireAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createBookingSchema } = require("../validators/bookings.validators");

const router = express.Router();

router.post("/", requireAuth, validate(createBookingSchema), createBooking);
router.patch("/:id/confirm", requireAuth, confirmBooking);

module.exports = router;
