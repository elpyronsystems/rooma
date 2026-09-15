// Rooma's business model: listings are free, revenue comes from a cut
// of transactions actually paid through the platform. Kept as a single
// constant so it's a one-line change if the rate is ever revised.
const PLATFORM_FEE_PERCENT = 5;

/**
 * Computes and rounds the platform's cut and the owner's net amount for
 * a given payment total. Returned as plain numbers (not Decimal
 * instances) — the caller passes these straight into a Prisma create,
 * which handles the Decimal conversion itself.
 */
function computeFees(amount) {
  const platformFeeAmount = Math.round(amount * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;
  const netAmount = Math.round((amount - platformFeeAmount) * 100) / 100;
  return { platformFeeAmount, platformFeePercent: PLATFORM_FEE_PERCENT, netAmount };
}

module.exports = { PLATFORM_FEE_PERCENT, computeFees };
