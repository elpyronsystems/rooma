const { z } = require("zod");

const payoutSettingsSchema = z.object({
  payoutMethod: z.enum(["mtn_momo", "telecel_cash", "bank"]).optional().or(z.literal("")),
  payoutMomoNumber: z.string().trim().max(20).optional().or(z.literal("")),
  payoutBankName: z.string().trim().max(100).optional().or(z.literal("")),
  payoutBankAccountNumber: z.string().trim().max(50).optional().or(z.literal("")),
  payoutBankAccountName: z.string().trim().max(150).optional().or(z.literal("")),
});

module.exports = { payoutSettingsSchema };
