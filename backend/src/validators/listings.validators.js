const { z } = require("zod");

const createListingSchema = z.object({
  type: z.enum(["hostel", "hotel", "rental", "sale"]),
  title: z.string().trim().min(3, "title must be at least 3 characters").max(200),
  description: z.string().max(5000).optional(),
  price: z.number().positive("price must be a positive number"),
  currency: z.string().length(3).optional(),
  priceNegotiable: z.boolean().optional(),
  address: z.string().max(300).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  hostelDetails: z.object({
    universityId: z.string().uuid().optional(),
    roomType: z.string().optional(),
    capacity: z.number().int().positive().optional(),
    distanceToCampusKm: z.number().nonnegative().optional(),
  }).optional(),
  hotelDetails: z.object({
    starRating: z.number().int().min(1).max(5).optional(),
    amenities: z.array(z.string()).optional(),
  }).optional(),
  rentalDetails: z.object({
    bedrooms: z.number().int().nonnegative().optional(),
    bathrooms: z.number().int().nonnegative().optional(),
    leaseTerm: z.string().optional(),
    furnished: z.boolean().optional(),
  }).optional(),
  saleDetails: z.object({
    bedrooms: z.number().int().nonnegative().optional(),
    bathrooms: z.number().int().nonnegative().optional(),
    landSizeSqm: z.number().positive().optional(),
  }).optional(),
});

// Query params arrive as strings, so this schema coerces them to the
// right type instead of assuming numbers — this fixes a real bug where
// Number("garbage") silently became NaN and broke the Prisma filter.
const searchListingsSchema = z.object({
  type: z.enum(["hostel", "hotel", "rental", "sale"]).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  universityId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
});

module.exports = { createListingSchema, searchListingsSchema };
