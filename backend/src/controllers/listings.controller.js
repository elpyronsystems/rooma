const prisma = require("../config/prisma");

/**
 * POST /api/listings
 * Creates a listing for the authenticated user (landlord/agent/hotel_manager).
 * Vertical-specific fields (hostelDetails, hotelDetails, etc.) are optional
 * and created alongside the base listing depending on `type`.
 */
async function createListing(req, res, next) {
  try {
    const {
      type, title, description, price, currency,
      priceNegotiable, address, latitude, longitude,
      hostelDetails, hotelDetails, rentalDetails, saleDetails,
    } = req.body;

    if (!type || !title || price === undefined) {
      return res.status(400).json({ error: "type, title, and price are required" });
    }

    const listing = await prisma.listing.create({
      data: {
        ownerId: req.user.id,
        type,
        title,
        description,
        price,
        currency: currency || "GHS",
        priceNegotiable: !!priceNegotiable,
        address,
        latitude,
        longitude,
        status: "pending_review",
        ...(type === "hostel" && hostelDetails
          ? { hostelDetails: { create: hostelDetails } }
          : {}),
        ...(type === "hotel" && hotelDetails
          ? { hotelDetails: { create: hotelDetails } }
          : {}),
        ...(type === "rental" && rentalDetails
          ? { rentalDetails: { create: rentalDetails } }
          : {}),
        ...(type === "sale" && saleDetails
          ? { saleDetails: { create: saleDetails } }
          : {}),
      },
      include: { hostelDetails: true, hotelDetails: true, rentalDetails: true, saleDetails: true },
    });

    res.status(201).json(listing);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/listings
 * Search & filter — supports the roadmap's "advanced filtering"
 * (type, price range, location, university).
 * Query params: type, minPrice, maxPrice, universityId, lat, lng, radiusKm
 */
async function searchListings(req, res, next) {
  try {
    const { type, minPrice, maxPrice, universityId, search } = req.query;

    const where = {
      status: "active",
      ...(type ? { type } : {}),
      ...(minPrice || maxPrice
        ? {
            price: {
              ...(minPrice ? { gte: Number(minPrice) } : {}),
              ...(maxPrice ? { lte: Number(maxPrice) } : {}),
            },
          }
        : {}),
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      ...(universityId ? { hostelDetails: { universityId } } : {}),
    };

    const listings = await prisma.listing.findMany({
      where,
      include: { media: true, hostelDetails: true, hotelDetails: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json(listings);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/listings/:id
 */
async function getListing(req, res, next) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        media: true,
        hostelDetails: true,
        hotelDetails: { include: { listing: false } },
        roomTypes: true,
        rentalDetails: true,
        saleDetails: true,
        ratings: true,
      },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    res.json(listing);
  } catch (err) {
    next(err);
  }
}

module.exports = { createListing, searchListings, getListing };
