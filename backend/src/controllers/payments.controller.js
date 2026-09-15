const { randomUUID } = require("crypto");
const prisma = require("../config/prisma");
const { computeFees } = require("../config/payments");
const { getAdapter } = require("../payments/adapters");

const VALID_PROVIDERS = ["mtn_momo", "telecel_cash", "bank"];

/**
 * Looks up the owner's payout settings for a listing and attempts to
 * send them their share (netAmount) of a successful payment. Never
 * throws to the caller on failure — a disbursement problem shouldn't
 * undo the fact that the seeker's payment already succeeded; it's
 * recorded as a failed/pending disbursement instead, visible to admins
 * for manual follow-up.
 */
async function attemptDisbursement(payment) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: payment.bookingId },
      include: { listing: { include: { owner: true } } },
    });
    const owner = booking?.listing?.owner;
    if (!owner || !owner.payoutMethod) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { disbursementStatus: "pending" },
      });
      return;
    }

    const adapter = getAdapter(owner.payoutMethod);
    const reference = `rooma-payout-${payment.id.slice(0, 8)}-${randomUUID().slice(0, 8)}`;

    const result = await adapter.disburse({
      amount: parseFloat(payment.netAmount),
      currency: payment.currency,
      phoneNumber: owner.payoutMomoNumber,
      reference,
      note: `Rooma payout for booking ${payment.bookingId}`,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        disbursementStatus: "pending",
        disbursementReference: result.reference,
      },
    });
  } catch (err) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { disbursementStatus: "failed" },
    });
  }
}

/**
 * POST /api/bookings/:id/payments
 * Seeker-only, and only for their own booking. The booking must already
 * be confirmed by the owner. mtn_momo/telecel_cash require the seeker's
 * phone number (a push prompt goes directly to their phone); bank
 * returns manual transfer instructions instead of charging anything
 * automatically.
 */
async function initiatePayment(req, res, next) {
  try {
    const { id: bookingId } = req.params;
    const { provider, phoneNumber } = req.body;

    if (!VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: `provider must be one of: ${VALID_PROVIDERS.join(", ")}` });
    }
    if ((provider === "mtn_momo" || provider === "telecel_cash") && !phoneNumber) {
      return res.status(400).json({ error: "phoneNumber is required for mobile money payments" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, listing: { include: { owner: true } } },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    if (booking.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only pay for your own bookings" });
    }
    if (booking.status !== "confirmed") {
      return res.status(400).json({ error: "This booking isn't confirmed yet, so there's nothing to pay for" });
    }

    let adapter;
    try {
      adapter = getAdapter(provider);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const amount = parseFloat(booking.totalAmount);
    const { platformFeeAmount, platformFeePercent, netAmount } = computeFees(amount);
    const reference = `rooma-${bookingId.slice(0, 8)}-${randomUUID().slice(0, 8)}`;

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount,
        platformFeeAmount,
        platformFeePercent,
        netAmount,
        currency: booking.currency,
        provider,
        status: "pending",
        providerReference: reference,
      },
    });

    try {
      const result = await adapter.initiatePayment({
        amount,
        currency: booking.currency,
        phoneNumber,
        reference,
        note: `Rooma booking payment — ${booking.listing?.title ?? "listing"}`,
      });

      if (result.requiresManualTransfer) {
        const platformSettings = await prisma.platformPayoutSettings.findUnique({ where: { id: "singleton" } });
        return res.status(201).json({
          paymentId: payment.id,
          reference: result.reference,
          requiresManualTransfer: true,
          instructions: {
            ownerAmount: netAmount,
            ownerBankName: booking.listing.owner.payoutBankName,
            ownerAccountNumber: booking.listing.owner.payoutBankAccountNumber,
            ownerAccountName: booking.listing.owner.payoutBankAccountName,
            platformAmount: platformFeeAmount,
            platformBankName: platformSettings?.payoutBankName,
            platformAccountNumber: platformSettings?.payoutBankAccountNumber,
            platformAccountName: platformSettings?.payoutBankAccountName,
            currency: booking.currency,
          },
        });
      }

      res.status(201).json({ paymentId: payment.id, reference: result.reference, requiresPolling: true });
    } catch (err) {
      if (err.code === "PROVIDER_NOT_CONFIGURED") {
        return res.status(503).json({
          error: `Online payments via ${provider.replace("_", " ")} aren't live yet. Please arrange payment directly with the provider for now.`,
        });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/payments/verify/:reference
 * Polled by the frontend after a mobile money push prompt is sent
 * (there's no redirect/callback for these, unlike card gateways) to
 * find out whether the seeker approved or declined. On success, this is
 * also the moment the owner's payout gets triggered.
 */
async function verifyPaymentByReference(req, res, next) {
  try {
    const { reference } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { providerReference: reference },
      include: { booking: true },
    });
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    if (payment.booking.userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "You can't view this payment" });
    }

    if (payment.status === "successful") {
      return res.json(payment);
    }

    let adapter;
    try {
      adapter = getAdapter(payment.provider);
    } catch {
      return res.json(payment);
    }

    const verification = await adapter.verifyPayment(payment.providerReference);

    if (verification.success) {
      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "successful", paidAt: verification.paidAt || new Date() },
      });
      attemptDisbursement(updated); // fire-and-forget — never block the seeker's confirmation on this
      return res.json(updated);
    }

    if (verification.failed) {
      const updated = await prisma.payment.update({ where: { id: payment.id }, data: { status: "failed" } });
      return res.json(updated);
    }

    res.json(payment);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/bookings/:id/payment
 */
async function getBookingPayment(req, res, next) {
  try {
    const { id: bookingId } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { listing: true } });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const isSeeker = booking.userId === req.user.id;
    const isOwner = booking.listing.ownerId === req.user.id;
    if (!isSeeker && !isOwner && req.user.role !== "admin") {
      return res.status(403).json({ error: "You can't view this payment" });
    }

    const payment = await prisma.payment.findFirst({ where: { bookingId }, orderBy: { createdAt: "desc" } });
    res.json(payment);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/payments/:id/confirm — admin only. This is the
 * primary path for bank transfers (there's no automated status check
 * possible), and a fallback for mobile money if polling ever misses a
 * result. Triggers the owner's disbursement the same as an automated
 * confirmation would.
 */
async function confirmManualPayment(req, res, next) {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    if (payment.status === "successful") {
      return res.json(payment);
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: { status: "successful", paidAt: new Date() },
    });

    attemptDisbursement(updated);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { initiatePayment, verifyPaymentByReference, getBookingPayment, confirmManualPayment };
