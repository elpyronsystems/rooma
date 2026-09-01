const express = require("express");
const { createBooking, confirmBooking } = require("../controllers/bookings.controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/", requireAuth, createBooking);
router.patch("/:id/confirm", requireAuth, confirmBooking);

module.exports = router;
