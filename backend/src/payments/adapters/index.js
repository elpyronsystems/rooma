const mtnMomoAdapter = require("./mtnMomoAdapter");
const telecelCashAdapter = require("./telecelCashAdapter");
const bankAdapter = require("./bankAdapter");

// Direct integrations, one per network — matches how people in Ghana
// actually expect to pay, and avoids running everything through a
// single aggregator. Each adapter shares the same shape (isConfigured,
// isDisbursementConfigured, initiatePayment, verifyPayment, disburse,
// verifyDisbursement), so payments.controller.js never needs to know
// which network it's actually talking to.
const ADAPTERS = {
  mtn_momo: mtnMomoAdapter,
  telecel_cash: telecelCashAdapter,
  bank: bankAdapter,
};

function notImplementedError(provider) {
  const err = new Error(`${provider} isn't wired up yet.`);
  err.code = "PROVIDER_NOT_IMPLEMENTED";
  return err;
}

function unknownProviderError(provider) {
  const err = new Error(`Unknown payment provider: ${provider}`);
  err.code = "PROVIDER_UNKNOWN";
  return err;
}

/**
 * Returns the adapter for a given user-facing provider choice. Throws a
 * typed error — PROVIDER_NOT_IMPLEMENTED or PROVIDER_UNKNOWN — the
 * caller turns into a clean 4xx response rather than a raw 500.
 */
function getAdapter(provider) {
  if (provider in ADAPTERS) {
    return ADAPTERS[provider];
  }
  if (provider === "stripe" || provider === "paypal") {
    // Stripe genuinely can't be used by a Ghana-registered business —
    // see the deployment notes. PayPal only supports a narrow set of
    // currencies (not GHS), so it isn't part of the core flow either.
    throw notImplementedError(provider);
  }
  throw unknownProviderError(provider);
}

module.exports = { getAdapter };
