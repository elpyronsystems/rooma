const { z } = require("zod");

// Ghana phone numbers: 10 digits, e.g. 0244000000. Adjust if you need to
// support the +233 international format too.
const phoneRegex = /^0\d{9}$/;

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "fullName must be at least 2 characters"),
  phoneNumber: z.string().regex(phoneRegex, "phoneNumber must be a valid 10-digit Ghana number (e.g. 0244000000)"),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(8, "password must be at least 8 characters"),
  role: z.enum(["seeker", "landlord", "agent", "hotel_manager"]).optional(),
});

const verifyOtpSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID"),
  code: z.string().length(6, "code must be 6 digits"),
});

const loginSchema = z.object({
  phoneNumber: z.string().regex(phoneRegex, "phoneNumber must be a valid 10-digit Ghana number"),
  password: z.string().min(1, "password is required"),
});

module.exports = { signupSchema, verifyOtpSchema, loginSchema };
