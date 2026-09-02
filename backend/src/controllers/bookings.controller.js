const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");

/**
 * Checks whether the requested date range overlaps with any existing
 * pending/confirmed booking for the same listing (and same room type,
 * when one is specified). Two ranges overlap when:
 *   existing.checkIn < new.checkOut  AND  existing.checkOut > new.checkIn
 *
 * For room-type bookings (hotels), a room type can have multiple units
 * available (roomType.quantityAvailable), so overlap alone isn't a
 * conflict — only when overlapping bookings already fill every unit.
 * For everything else (single-unit rentals/hostels/sales), any overlap
 * is a conflict.
 */
async function hasConflictingBooking(tx, { listingId, roomTypeId, checkIn, checkOut }) {
  if (!checkIn || !checkOut) {
    // Listings without check-in/out dates (e.g. a straightforward sale
    // enquiry) have nothing to conflict on.
    return false;
  }

  const overlapping = await tx.booking.findMany({
    where: {
      listingId,
      roomTypeId: roomTypeId || null,
      status: { in: ["pending", "confirmed"] },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
  });

  if (roomTypeId) {
    const roomType = await tx.roomType.findUnique({ where: { id: roomTypeId } });
    if (!roomType) return true; // treat a missing/invalid room type as a conflict — caller will 404 separately
    return overlapping.length >= roomType.quantityAvailable;
  }

  // Single-unit listing (rental/hostel bed/sale) — any overlap at all is a conflict.
  return overlapping.length > 0;
}

/**
 * POST /api/bookings
 * Seeker creates a booking request — starts as "pending" until the
 * manager/landlord confirms it (per the roadmap's requirement).
 *
 * Runs the conflict check and the insert inside a single serializable
 * transaction so two near-simultaneous requests for the same dates can't
 * both slip through the availability check before either one commits.
 */
async function createBooking(req, res, next) {
  try {
    const { listingId, roomTypeId, checkIn, checkOut, totalAmount, currency } = req.body;
    const checkInDate = checkIn ? new Date(checkIn) : undefined;
    const checkOutDate = checkOut ? new Date(checkOut) : undefined;

    const booking = await prisma.$transaction(
      async (tx) => {
        const listing = await tx.listing.findUnique({ where: { id: listingId } });
        if (!listing) {
          const err = new Error("Listing not found");
          err.status = 404;
          throw err;
        }

        const conflict = await hasConflictingBooking(tx, {
          listingId,
          roomTypeId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
        });

        if (conflict) {
          const err = new Error("These dates are no longer available for this listing.");
          err.status = 409;
          throw err;
        }

        return tx.booking.create({
          data: {
            listingId,
            roomTypeId,
            userId: req.user.id,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            totalAmount,
            currency: currency || "GHS",
            status: "pending",
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/bookings/:id/confirm
 * Only the listing owner (landlord/hotel_manager) or an admin can confirm.
 */
async function confirmBooking(req, res, next) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { listing: true },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const isOwner = booking.listing.ownerId === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Only the listing owner can confirm this booking" });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "confirmed", confirmedBy: req.user.id, confirmedAt: new Date() },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { createBooking, confirmBooking, hasConflictingBooking };
