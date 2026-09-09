const prisma = require("../config/prisma");

/**
 * POST /api/support
 * Public — no auth required, since the support page needs to work for
 * visitors who don't have an account yet. Saves the message so it's
 * reviewable by the team; outbound email notification isn't wired up
 * yet (needs an email service like SES/SendGrid).
 */
async function submitSupportMessage(req, res, next) {
  try {
    const { fullName, email, phoneNumber, category, subject, message } = req.body;

    await prisma.supportMessage.create({
      data: {
        fullName,
        email,
        phoneNumber: phoneNumber || null,
        category,
        subject,
        message,
      },
    });

    res.status(201).json({ message: "Your message has been received. Our support team will get back to you soon." });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitSupportMessage };
