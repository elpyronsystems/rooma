const express = require("express");
const { saveListing, unsaveListing, getSavedListings } = require("../controllers/savedListings.controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, getSavedListings);
router.post("/:listingId", requireAuth, saveListing);
router.delete("/:listingId", requireAuth, unsaveListing);

module.exports = router;
