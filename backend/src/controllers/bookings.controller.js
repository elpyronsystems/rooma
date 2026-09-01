const prisma = require("../config/prisma");

/**
 * POST /api/bookings
 * Seeker creates a booking request — starts as "pending" until the
 * manager/landlord confirms it (per the roadmap's requirement).
 */
async function createBooking(req, res, next) {
  try {
    const { listingId, roomTypeId, checkIn, checkOut, totalAmount, currency } = req.body;

    if (!listingId || totalAmount === undefined) {
      return res.status(400).json({ error: "listingId and totalAmount are required" });
    }

    const booking = await prisma.booking.create({
      data: {
        listingId,
        roomTypeId,
        userId: req.user.id,
        checkIn: checkIn ? new Date(checkIn) : undefined,
        checkOut: checkOut ? new Date(checkOut) : undefined,
        totalAmount,
        currency: currency || "GHS",
        status: "pending",
      },
    });

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

module.exports = { createBooking, confirmBooking };
