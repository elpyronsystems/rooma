const prisma = require("../config/prisma");

/**
 * POST /api/listings/:listingId/ratings
 * Creates or updates the authenticated user's rating for a listing
 * (one rating per user per listing, enforced by a unique constraint in the DB).
 * Recalculates the listing's averageRating/ratingCount afterward.
 */
async function rateListing(req, res, next) {
  try {
    const { listingId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be a number between 1 and 5" });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // upsert: create the rating if it's the user's first time, otherwise update it
    await prisma.rating.upsert({
      where: { listingId_userId: { listingId, userId: req.user.id } },
      update: { rating, comment },
      create: { listingId, userId: req.user.id, rating, comment },
    });

    // Recalculate the listing's average rating and count from all ratings.
    const stats = await prisma.rating.aggregate({
      where: { listingId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: {
        averageRating: stats._avg.rating || 0,
        ratingCount: stats._count.rating,
      },
    });

    res.status(201).json({
      message: "Rating saved",
      averageRating: updatedListing.averageRating,
      ratingCount: updatedListing.ratingCount,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/listings/:listingId/ratings
 * Public — anyone browsing a listing can see its reviews.
 */
async function getListingRatings(req, res, next) {
  try {
    const { listingId } = req.params;

    const ratings = await prisma.rating.findMany({
      where: { listingId },
      include: { user: { select: { id: true, fullName: true, profilePhotoUrl: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json(ratings);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/listings/:listingId/ratings
 * A user removing their own rating.
 */
async function deleteRating(req, res, next) {
  try {
    const { listingId } = req.params;

    const existing = await prisma.rating.findUnique({
      where: { listingId_userId: { listingId, userId: req.user.id } },
    });

    if (!existing) {
      return res.status(404).json({ error: "You haven't rated this listing" });
    }

    await prisma.rating.delete({ where: { id: existing.id } });

    const stats = await prisma.rating.aggregate({
      where: { listingId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.listing.update({
      where: { id: listingId },
      data: {
        averageRating: stats._avg.rating || 0,
        ratingCount: stats._count.rating,
      },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { rateListing, getListingRatings, deleteRating };
