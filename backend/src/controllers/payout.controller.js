const prisma = require("../config/prisma");

const PAYOUT_SELECT = {
  payoutMethod: true,
  payoutMomoNumber: true,
  payoutBankName: true,
  payoutBankAccountNumber: true,
  payoutBankAccountName: true,
};

/**
 * GET /api/payout/me
 * The authenticated user's own payout destination — where their 95%
 * share of a booking payment gets sent.
 */
async function getMyPayoutSettings(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: PAYOUT_SELECT });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/payout/me
 */
async function updateMyPayoutSettings(req, res, next) {
  try {
    const { payoutMethod, payoutMomoNumber, payoutBankName, payoutBankAccountNumber, payoutBankAccountName } =
      req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        payoutMethod: payoutMethod ?? null,
        payoutMomoNumber: payoutMomoNumber ?? null,
        payoutBankName: payoutBankName ?? null,
        payoutBankAccountNumber: payoutBankAccountNumber ?? null,
        payoutBankAccountName: payoutBankAccountName ?? null,
      },
      select: PAYOUT_SELECT,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/payout-settings
 * Where Rooma's own 5% commission gets sent — a single platform-wide
 * setting, not per-user.
 */
async function getPlatformPayoutSettings(req, res, next) {
  try {
    const settings = await prisma.platformPayoutSettings.findUnique({ where: { id: "singleton" } });
    res.json(
      settings || {
        payoutMethod: null,
        payoutMomoNumber: null,
        payoutBankName: null,
        payoutBankAccountNumber: null,
        payoutBankAccountName: null,
      }
    );
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/payout-settings
 */
async function updatePlatformPayoutSettings(req, res, next) {
  try {
    const { payoutMethod, payoutMomoNumber, payoutBankName, payoutBankAccountNumber, payoutBankAccountName } =
      req.body;

    const updated = await prisma.platformPayoutSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        payoutMethod: payoutMethod ?? null,
        payoutMomoNumber: payoutMomoNumber ?? null,
        payoutBankName: payoutBankName ?? null,
        payoutBankAccountNumber: payoutBankAccountNumber ?? null,
        payoutBankAccountName: payoutBankAccountName ?? null,
      },
      update: {
        payoutMethod: payoutMethod ?? null,
        payoutMomoNumber: payoutMomoNumber ?? null,
        payoutBankName: payoutBankName ?? null,
        payoutBankAccountNumber: payoutBankAccountNumber ?? null,
        payoutBankAccountName: payoutBankAccountName ?? null,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyPayoutSettings,
  updateMyPayoutSettings,
  getPlatformPayoutSettings,
  updatePlatformPayoutSettings,
};
