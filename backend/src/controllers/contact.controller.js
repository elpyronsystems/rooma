const prisma = require("../config/prisma");

/**
 * GET /api/contact/me
 * Returns the authenticated user's own contact details (as set for their
 * listings). Available to anyone logged in, though only landlord/agent/
 * hotel_manager accounts have a practical reason to set this.
 */
async function getMyContact(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        businessName: true,
        contactPhone: true,
        contactEmail: true,
        contactWhatsapp: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/contact/me
 * Updates the authenticated user's contact details. Every field is
 * optional — a provider can fill in only what they want shown.
 */
async function updateMyContact(req, res, next) {
  try {
    const { businessName, contactPhone, contactEmail, contactWhatsapp } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        businessName: businessName ?? null,
        contactPhone: contactPhone ?? null,
        contactEmail: contactEmail ?? null,
        contactWhatsapp: contactWhatsapp ?? null,
      },
      select: {
        businessName: true,
        contactPhone: true,
        contactEmail: true,
        contactWhatsapp: true,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyContact, updateMyContact };
