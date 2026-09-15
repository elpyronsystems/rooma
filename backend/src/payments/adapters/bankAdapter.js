// There's no universal, self-service API across Ghanaian banks the way
// there is for mobile money — each bank has its own separate corporate
// API (if any), typically requiring a direct relationship with that
// specific bank. Rather than blocking bank transfer entirely, this
// adapter takes the honest, common approach for marketplaces at this
// stage: show the seeker exactly where to send each portion of the
// money, and let an admin manually confirm once it's actually arrived
// (see payments.controller.js's confirmManualPayment).
//
// "isConfigured" here just means "the platform's own payout bank
// details have been filled in" — there's no external service to
// authenticate against.

function isConfigured() {
  return true; // always available — no external credentials needed
}

function isDisbursementConfigured() {
  return true; // disbursement here is also just a manual bank transfer
}

/**
 * Doesn't call any external API — just confirms the request is valid
 * and hands back a reference. The actual "instructions" (whose bank
 * account gets what) are assembled in payments.controller.js, since
 * they depend on the platform's and the owner's payout settings, not
 * anything this adapter itself knows about.
 */
async function initiatePayment({ reference }) {
  return { reference, requiresManualTransfer: true };
}

/**
 * A bank transfer's real status is whatever an admin has manually set
 * it to (see confirmManualPayment) — this adapter has no external
 * source of truth to check against.
 */
async function verifyPayment() {
  return { success: false, failed: false, pending: true };
}

async function disburse({ reference }) {
  return { reference };
}

async function verifyDisbursement() {
  return { success: false, failed: false };
}

module.exports = { isConfigured, isDisbursementConfigured, initiatePayment, verifyPayment, disburse, verifyDisbursement };
