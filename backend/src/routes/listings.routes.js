const express = require("express");
const { createListing, searchListings, getListing, getMyListings, updateListing } = require("../controllers/listings.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createListingSchema, searchListingsSchema, updateListingSchema } = require("../validators/listings.validators");

const router = express.Router();

// Public — browsing/search does not require login
router.get("/", validate(searchListingsSchema, "query"), searchListings);

// Must come before "/:id" — otherwise Express would treat "mine" as an id.
router.get(
  "/mine",
  requireAuth,
  requireRole("landlord", "agent", "hotel_manager", "admin"),
  getMyListings
);

router.get("/:id", getListing);

// Protected — only providers can create listings
router.post(
  "/",
  requireAuth,
  requireRole("landlord", "agent", "hotel_manager", "admin"),
  validate(createListingSchema),
  createListing
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("landlord", "agent", "hotel_manager", "admin"),
  validate(updateListingSchema),
  updateListing
);

module.exports = router;
