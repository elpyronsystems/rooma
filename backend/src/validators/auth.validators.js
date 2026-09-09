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

// Separate from the regular signup schema on purpose — role is never a
// client-supplied field here (always forced to "admin" in the
// controller), so there's no way to reach admin via the normal signup
// endpoint even by tampering with the request body.
const adminSignupSchema = z.object({
  fullName: z.string().trim().min(2, "fullName must be at least 2 characters"),
  phoneNumber: z.string().regex(phoneRegex, "phoneNumber must be a valid 10-digit Ghana number (e.g. 0244000000)"),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(8, "password must be at least 8 characters"),
  accessCode: z.string().min(1, "accessCode is required"),
});

const verifyOtpSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID"),
  code: z.string().length(6, "code must be 6 digits"),
});

const loginSchema = z.object({
  // Accepts a phone number, email, or full name — resolved in the
  // controller since which one it is depends on the value's shape.
  identifier: z.string().trim().min(1, "Enter your phone number, email, or full name"),
  password: z.string().min(1, "password is required"),
});

module.exports = { signupSchema, adminSignupSchema, verifyOtpSchema, loginSchema };
