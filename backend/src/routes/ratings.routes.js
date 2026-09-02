const express = require("express");
const { rateListing, getListingRatings, deleteRating } = require("../controllers/ratings.controller");
const { requireAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { rateListingSchema } = require("../validators/bookings.validators");

// mergeParams lets this router read :listingId from the parent mount path
const router = express.Router({ mergeParams: true });

router.get("/", getListingRatings);
router.post("/", requireAuth, validate(rateListingSchema), rateListing);
router.delete("/", requireAuth, deleteRating);

module.exports = router;
