// IMPORTANT — read before use: unlike the MTN MoMo adapter next to this
// file, I don't have verified, current documentation for Telecel Cash's
// actual merchant API endpoints, so this file is a correctly-shaped
// STUB, not a tested integration. It matches the same
// isConfigured/initiatePayment/verifyPayment/disburse contract every
// other adapter uses, so the rest of the app (routes, controllers,
// frontend) never needs to change — but the actual fetch() calls below
// need their URLs, headers, and request/response shapes corrected once
// you have Telecel's real developer portal access and docs. Search
// "Telecel Cash API Ghana developer" or contact your Telecel business
// account manager for the current specification.

function isConfigured() {
  return Boolean(process.env.TELECEL_CASH_API_KEY && process.env.TELECEL_CASH_MERCHANT_ID);
}

function isDisbursementConfigured() {
  return Boolean(process.env.TELECEL_CASH_DISBURSEMENT_API_KEY);
}

function notConfiguredError(what) {
  const err = new Error(`Telecel Cash ${what} isn't configured yet.`);
  err.code = "PROVIDER_NOT_CONFIGURED";
  return err;
}

/**
 * TODO: replace with Telecel's real "collect from customer" endpoint
 * once you have their API documentation. The shape below (amount,
 * phoneNumber, reference, note in; reference + requiresPolling out) is
 * deliberately kept identical to the MTN adapter so nothing else in the
 * app needs to know which mobile money network is being used.
 */
async function initiatePayment({ amount, currency, phoneNumber, reference, note }) {
  if (!isConfigured()) throw notConfiguredError("payments");

  // Placeholder request — confirm the real base URL, path, headers,
  // and body field names against Telecel's actual documentation before
  // relying on this.
  const response = await fetch(`${process.env.TELECEL_CASH_BASE_URL || ""}/collections/request`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TELECEL_CASH_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      merchantId: process.env.TELECEL_CASH_MERCHANT_ID,
      amount: amount.toFixed(2),
      currency: currency || "GHS",
      msisdn: phoneNumber,
      reference,
      description: note || "Rooma booking payment",
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.message || "Telecel Cash failed to send the payment request");
    err.code = "PROVIDER_ERROR";
    throw err;
  }

  return { reference: data.reference || reference, requiresPolling: true };
}

/**
 * TODO: replace with Telecel's real transaction-status endpoint.
 */
async function verifyPayment(reference) {
  if (!isConfigured()) throw notConfiguredError("payments");

  const response = await fetch(
    `${process.env.TELECEL_CASH_BASE_URL || ""}/collections/status/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${process.env.TELECEL_CASH_API_KEY}` } }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.message || "Couldn't check this Telecel Cash payment's status");
    err.code = "PROVIDER_ERROR";
    throw err;
  }

  return {
    success: data.status === "SUCCESSFUL" || data.status === "success",
    failed: data.status === "FAILED" || data.status === "failed",
    pending: data.status === "PENDING" || data.status === "pending",
    amount: data.amount ? parseFloat(data.amount) : null,
    currency: data.currency,
    reference,
    paidAt: data.status === "SUCCESSFUL" || data.status === "success" ? new Date() : null,
  };
}

/**
 * TODO: replace with Telecel's real disbursement/payout endpoint.
 */
async function disburse({ amount, currency, phoneNumber, reference, note }) {
  if (!isDisbursementConfigured()) throw notConfiguredError("disbursements");

  const response = await fetch(`${process.env.TELECEL_CASH_BASE_URL || ""}/disbursements/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TELECEL_CASH_DISBURSEMENT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amount.toFixed(2),
      currency: currency || "GHS",
      msisdn: phoneNumber,
      reference,
      description: note || "Rooma payout",
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.message || "Telecel Cash failed to send the payout");
    err.code = "PROVIDER_ERROR";
    throw err;
  }

  return { reference: data.reference || reference };
}

async function verifyDisbursement(reference) {
  if (!isDisbursementConfigured()) throw notConfiguredError("disbursements");

  const response = await fetch(
    `${process.env.TELECEL_CASH_BASE_URL || ""}/disbursements/status/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${process.env.TELECEL_CASH_DISBURSEMENT_API_KEY}` } }
  );
  const data = await response.json().catch(() => ({}));
  return {
    success: data.status === "SUCCESSFUL" || data.status === "success",
    failed: data.status === "FAILED" || data.status === "failed",
  };
}

module.exports = {
  isConfigured,
  isDisbursementConfigured,
  initiatePayment,
  verifyPayment,
  disburse,
  verifyDisbursement,
};
