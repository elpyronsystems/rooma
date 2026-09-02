const { z } = require("zod");

const createBookingSchema = z.object({
  listingId: z.string().uuid("listingId must be a valid UUID"),
  roomTypeId: z.string().uuid().optional(),
  checkIn: z.string().datetime().optional().or(z.string().date().optional()),
  checkOut: z.string().datetime().optional().or(z.string().date().optional()),
  totalAmount: z.number().positive("totalAmount must be a positive number"),
  currency: z.string().length(3).optional(),
}).refine(
  (data) => !data.checkIn || !data.checkOut || new Date(data.checkOut) >= new Date(data.checkIn),
  { message: "checkOut must be on or after checkIn", path: ["checkOut"] }
);

const rateListingSchema = z.object({
  rating: z.number().int().min(1, "rating must be between 1 and 5").max(5, "rating must be between 1 and 5"),
  comment: z.string().max(1000).optional(),
});

module.exports = { createBookingSchema, rateListingSchema };
