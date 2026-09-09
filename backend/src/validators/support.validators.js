const { z } = require("zod");

const CATEGORY_VALUES = [
  "finding_accommodation",
  "booking",
  "payment",
  "my_account",
  "property_listing",
  "verification",
  "report_a_problem",
  "other",
];

const submitSupportMessageSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email"),
  phoneNumber: z.string().trim().max(20).optional().or(z.literal("")),
  category: z.enum(CATEGORY_VALUES),
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(200),
  message: z.string().trim().min(10, "Please tell us a bit more (at least 10 characters)").max(4000),
});

module.exports = { submitSupportMessageSchema, CATEGORY_VALUES };
