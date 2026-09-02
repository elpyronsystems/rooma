const { hasConflictingBooking } = require("../src/controllers/bookings.controller");

// A minimal fake "tx" (transaction client) — only implements the two
// Prisma calls hasConflictingBooking actually uses, so these tests check
// the conflict logic itself without touching a real database.
function makeFakeTx({ existingBookings = [], roomType = null }) {
  return {
    booking: {
      findMany: jest.fn().mockResolvedValue(existingBookings),
    },
    roomType: {
      findUnique: jest.fn().mockResolvedValue(roomType),
    },
  };
}

describe("hasConflictingBooking", () => {
  it("returns false when there are no dates to conflict on", async () => {
    const tx = makeFakeTx({});
    const result = await hasConflictingBooking(tx, {
      listingId: "listing-1",
      roomTypeId: null,
      checkIn: undefined,
      checkOut: undefined,
    });
    expect(result).toBe(false);
  });

  it("returns true for a single-unit listing (no roomTypeId) when any overlap exists", async () => {
    const tx = makeFakeTx({ existingBookings: [{ id: "existing-1" }] });
    const result = await hasConflictingBooking(tx, {
      listingId: "listing-1",
      roomTypeId: null,
      checkIn: new Date("2026-09-10"),
      checkOut: new Date("2026-09-15"),
    });
    expect(result).toBe(true);
  });

  it("returns false for a single-unit listing when no overlap exists", async () => {
    const tx = makeFakeTx({ existingBookings: [] });
    const result = await hasConflictingBooking(tx, {
      listingId: "listing-1",
      roomTypeId: null,
      checkIn: new Date("2026-09-10"),
      checkOut: new Date("2026-09-15"),
    });
    expect(result).toBe(false);
  });

  it("returns false for a room-type booking when overlaps are fewer than available units", async () => {
    const tx = makeFakeTx({
      existingBookings: [{ id: "existing-1" }],
      roomType: { id: "room-1", quantityAvailable: 3 },
    });
    const result = await hasConflictingBooking(tx, {
      listingId: "listing-1",
      roomTypeId: "room-1",
      checkIn: new Date("2026-09-10"),
      checkOut: new Date("2026-09-15"),
    });
    expect(result).toBe(false);
  });

  it("returns true for a room-type booking when overlaps already fill every unit", async () => {
    const tx = makeFakeTx({
      existingBookings: [{ id: "existing-1" }, { id: "existing-2" }],
      roomType: { id: "room-1", quantityAvailable: 2 },
    });
    const result = await hasConflictingBooking(tx, {
      listingId: "listing-1",
      roomTypeId: "room-1",
      checkIn: new Date("2026-09-10"),
      checkOut: new Date("2026-09-15"),
    });
    expect(result).toBe(true);
  });

  it("treats a nonexistent room type as a conflict rather than allowing an unlimited booking", async () => {
    const tx = makeFakeTx({ existingBookings: [], roomType: null });
    const result = await hasConflictingBooking(tx, {
      listingId: "listing-1",
      roomTypeId: "does-not-exist",
      checkIn: new Date("2026-09-10"),
      checkOut: new Date("2026-09-15"),
    });
    expect(result).toBe(true);
  });
});
