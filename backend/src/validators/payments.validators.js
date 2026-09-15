const { z } = require("zod");

const initiatePaymentSchema = z.object({
  provider: z.enum(["mtn_momo", "telecel_cash", "bank"]),
  phoneNumber: z.string().trim().optional(),
});

module.exports = { initiatePaymentSchema };
