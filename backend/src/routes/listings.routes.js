const express = require("express");
const { createListing, searchListings, getListing } = require("../controllers/listings.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createListingSchema, searchListingsSchema } = require("../validators/listings.validators");

const router = express.Router();

// Public — browsing/search does not require login
router.get("/", validate(searchListingsSchema, "query"), searchListings);
router.get("/:id", getListing);

// Protected — only providers can create listings
router.post(
  "/",
  requireAuth,
  requireRole("landlord", "agent", "hotel_manager", "admin"),
  validate(createListingSchema),
  createListing
);

module.exports = router;
