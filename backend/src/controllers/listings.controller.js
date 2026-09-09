const prisma = require("../config/prisma");
const { attachSignedUrlsToListing, attachSignedUrlsToListings } = require("../utils/mediaUrls");
const { recordAudit } = require("../utils/audit");

// Public contact fields to show on a listing so seekers can reach the
// provider — excludes passwordHash and anything else sensitive.
const OWNER_SELECT = {
  select: {
    id: true,
    fullName: true,
    phoneNumber: true,
    email: true,
    businessName: true,
    contactPhone: true,
    contactEmail: true,
    contactWhatsapp: true,
  },
};

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
        // Listings go live immediately for now — there's no admin
        // moderation workflow yet, so gating on "pending_review" (which
        // nothing ever promotes to "active") made every new listing
        // invisible on Home/Hotels/Properties/Hostels/Explore. Revisit
        // this once an admin review flow exists.
        status: "active",
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
      include: { hostelDetails: true, hotelDetails: true, rentalDetails: true, saleDetails: true, owner: OWNER_SELECT },
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
    // req.query has already been validated and type-coerced by the
    // searchListingsSchema middleware (e.g. minPrice is a real number, not a string).
    const { type, minPrice, maxPrice, universityId, search } = req.query;

    const where = {
      status: "active",
      ...(type ? { type } : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      ...(universityId ? { hostelDetails: { universityId } } : {}),
    };

    const listings = await prisma.listing.findMany({
      where,
      include: { media: { orderBy: [{ isCover: "desc" }, { displayOrder: "asc" }] }, hostelDetails: true, hotelDetails: true, rentalDetails: true, saleDetails: true, owner: OWNER_SELECT },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Media URLs are stored as bare S3 keys (see controllers/media.controller.js) —
    // sign them into temporary, directly-usable URLs before responding.
    await attachSignedUrlsToListings(listings);

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
        media: { orderBy: [{ isCover: "desc" }, { displayOrder: "asc" }] },
        hostelDetails: true,
        hotelDetails: { include: { listing: false } },
        roomTypes: true,
        rentalDetails: true,
        saleDetails: true,
        ratings: true,
        owner: OWNER_SELECT,
      },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    await attachSignedUrlsToListing(listing);

    res.json(listing);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/listings/mine
 * Returns every listing owned by the authenticated user — including
 * inactive ones — so an owner can manage their full portfolio, not just
 * what's publicly visible.
 */
async function getMyListings(req, res, next) {
  try {
    const listings = await prisma.listing.findMany({
      where: { ownerId: req.user.id },
      include: { media: { orderBy: [{ isCover: "desc" }, { displayOrder: "asc" }] }, hostelDetails: true, hotelDetails: true, rentalDetails: true, saleDetails: true },
      orderBy: { createdAt: "desc" },
    });

    await attachSignedUrlsToListings(listings);

    res.json(listings);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/listings/:id
 * Updates a listing's own fields and/or its vertical-specific detail
 * record. Only the listing's owner or an admin may update it. Every
 * field is optional — send only what's changing.
 */
async function updateListing(req, res, next) {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const isOwner = listing.ownerId === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Only the listing owner can update this listing" });
    }

    const {
      title, description, price, currency, priceNegotiable, address, status,
      hostelDetails, hotelDetails, rentalDetails, saleDetails,
    } = req.body;

    const baseData = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price }),
      ...(currency !== undefined && { currency }),
      ...(priceNegotiable !== undefined && { priceNegotiable }),
      ...(address !== undefined && { address }),
      // Owners can only toggle between active/inactive themselves — the
      // other statuses (draft, pending_review, archived) are reserved
      // for the admin moderation flow, so we ignore anything else here
      // unless the requester is an admin.
      ...(status !== undefined &&
        (isAdmin || ["active", "inactive"].includes(status)) && { status }),
    };

    const detailUpdate = {};
    if (listing.type === "hostel" && hostelDetails) {
      detailUpdate.hostelDetails = { update: hostelDetails };
    }
    if (listing.type === "hotel" && hotelDetails) {
      detailUpdate.hotelDetails = { update: hotelDetails };
    }
    if (listing.type === "rental" && rentalDetails) {
      detailUpdate.rentalDetails = { update: rentalDetails };
    }
    if (listing.type === "sale" && saleDetails) {
      detailUpdate.saleDetails = { update: saleDetails };
    }

    const updated = await prisma.listing.update({
      where: { id: listing.id },
      data: { ...baseData, ...detailUpdate },
      include: { media: { orderBy: [{ isCover: "desc" }, { displayOrder: "asc" }] }, hostelDetails: true, hotelDetails: true, rentalDetails: true, saleDetails: true },
    });

    await attachSignedUrlsToListing(updated);

    await recordAudit({
      actorId: req.user.id,
      action: "listing.updated",
      entityType: "listing",
      entityId: listing.id,
      metadata: { changedFields: Object.keys(baseData), statusChanged: status !== undefined },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { createListing, searchListings, getListing, getMyListings, updateListing };
