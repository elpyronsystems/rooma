const { z } = require("zod");

const updateContactSchema = z.object({
  businessName: z.string().trim().max(150).optional().or(z.literal("")),
  contactPhone: z.string().trim().max(20).optional().or(z.literal("")),
  contactEmail: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  contactWhatsapp: z.string().trim().max(20).optional().or(z.literal("")),
});

module.exports = { updateContactSchema };
