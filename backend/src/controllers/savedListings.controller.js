const prisma = require("../config/prisma");

/**
 * POST /api/saved-listings/:listingId
 * Saves a listing to the authenticated user's favorites.
 */
async function saveListing(req, res, next) {
  try {
    const { listingId } = req.params;

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Composite primary key (userId + listingId) means a duplicate save
    // simply matches the existing row — upsert avoids a 500 on repeat saves.
    const saved = await prisma.savedListing.upsert({
      where: { userId_listingId: { userId: req.user.id, listingId } },
      update: {},
      create: { userId: req.user.id, listingId },
    });

    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/saved-listings/:listingId
 * Removes a listing from the authenticated user's favorites.
 */
async function unsaveListing(req, res, next) {
  try {
    const { listingId } = req.params;

    const existing = await prisma.savedListing.findUnique({
      where: { userId_listingId: { userId: req.user.id, listingId } },
    });

    if (!existing) {
      return res.status(404).json({ error: "This listing isn't in your saved list" });
    }

    await prisma.savedListing.delete({
      where: { userId_listingId: { userId: req.user.id, listingId } },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/saved-listings
 * Returns all listings the authenticated user has saved, most recent first.
 */
async function getSavedListings(req, res, next) {
  try {
    const saved = await prisma.savedListing.findMany({
      where: { userId: req.user.id },
      include: {
        listing: {
          include: { media: true, hostelDetails: true, hotelDetails: true },
        },
      },
      orderBy: { savedAt: "desc" },
    });

    res.json(saved.map((s) => s.listing));
  } catch (err) {
    next(err);
  }
}

module.exports = { saveListing, unsaveListing, getSavedListings };
