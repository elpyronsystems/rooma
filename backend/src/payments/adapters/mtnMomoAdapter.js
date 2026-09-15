const { randomUUID } = require("crypto");

// Sandbox by default — MTN issues your real production base URL and
// credentials only after they've approved your business (see the
// deployment notes). Nothing here needs to change except environment
// variables once that happens.
const BASE_URL = process.env.MTN_MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com";
const TARGET_ENV = process.env.MTN_MOMO_ENVIRONMENT || "sandbox";

function isConfigured() {
  return Boolean(
    process.env.MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY &&
      process.env.MTN_MOMO_COLLECTION_API_USER &&
      process.env.MTN_MOMO_COLLECTION_API_KEY
  );
}

function isDisbursementConfigured() {
  return Boolean(
    process.env.MTN_MOMO_DISBURSEMENT_SUBSCRIPTION_KEY &&
      process.env.MTN_MOMO_DISBURSEMENT_API_USER &&
      process.env.MTN_MOMO_DISBURSEMENT_API_KEY
  );
}

function notConfiguredError(what) {
  const err = new Error(`MTN MoMo ${what} isn't configured yet.`);
  err.code = "PROVIDER_NOT_CONFIGURED";
  return err;
}

// MTN's API expects Ghanaian numbers in international format (233...)
// without the leading 0 — this is the one formatting detail that trips
// up almost every first integration attempt.
function toMsisdn(phoneNumber) {
  return phoneNumber.replace(/^0/, "233").replace(/\s+/g, "");
}

async function getAccessToken(product) {
  const prefix = product === "collection" ? "MTN_MOMO_COLLECTION" : "MTN_MOMO_DISBURSEMENT";
  const apiUser = process.env[`${prefix}_API_USER`];
  const apiKey = process.env[`${prefix}_API_KEY`];
  const subscriptionKey = process.env[`${prefix}_SUBSCRIPTION_KEY`];

  const auth = Buffer.from(`${apiUser}:${apiKey}`).toString("base64");

  const response = await fetch(`${BASE_URL}/${product}/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Ocp-Apim-Subscription-Key": subscriptionKey,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.message || `Couldn't authenticate with MTN MoMo ${product}`);
    err.code = "PROVIDER_ERROR";
    throw err;
  }
  return data.access_token;
}

/**
 * Starts a "Request to Pay" — this sends a push prompt directly to the
 * seeker's phone asking them to approve the charge in their MoMo app.
 * There's no checkout URL the way there is with card-based gateways;
 * the frontend needs to poll verifyPayment() until the seeker responds.
 */
async function initiatePayment({ amount, currency, phoneNumber, reference, note }) {
  if (!isConfigured()) throw notConfiguredError("collections");
  if (!phoneNumber) {
    const err = new Error("A phone number is required for MTN MoMo payments");
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  const accessToken = await getAccessToken("collection");
  const referenceId = randomUUID();

  const response = await fetch(`${BASE_URL}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Ocp-Apim-Subscription-Key": process.env.MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY,
      "X-Reference-Id": referenceId,
      "X-Target-Environment": TARGET_ENV,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amount.toFixed(2),
      currency: currency || "GHS",
      externalId: reference,
      payer: { partyIdType: "MSISDN", partyId: toMsisdn(phoneNumber) },
      payerMessage: note || "Rooma booking payment",
      payeeNote: note || "Rooma booking payment",
    }),
  });

  if (response.status !== 202) {
    const data = await response.json().catch(() => ({}));
    const err = new Error(data.message || "MTN MoMo failed to send the payment request");
    err.code = "PROVIDER_ERROR";
    throw err;
  }

  return { reference: referenceId, requiresPolling: true };
}

/**
 * Checks the real status of a Request to Pay. MTN doesn't push a
 * webhook the way Paystack does unless a callback host was configured
 * ahead of time on their portal — polling this on demand is the
 * reliable path regardless of that setup.
 */
async function verifyPayment(referenceId) {
  if (!isConfigured()) throw notConfiguredError("collections");

  const accessToken = await getAccessToken("collection");
  const response = await fetch(`${BASE_URL}/collection/v1_0/requesttopay/${referenceId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Ocp-Apim-Subscription-Key": process.env.MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY,
      "X-Target-Environment": TARGET_ENV,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.message || "Couldn't check this MTN MoMo payment's status");
    err.code = "PROVIDER_ERROR";
    throw err;
  }

  return {
    success: data.status === "SUCCESSFUL",
    failed: data.status === "FAILED",
    pending: data.status === "PENDING",
    amount: data.amount ? parseFloat(data.amount) : null,
    currency: data.currency,
    reference: referenceId,
    paidAt: data.status === "SUCCESSFUL" ? new Date() : null,
  };
}

/**
 * Sends the owner's share of a booking payment to their MoMo number.
 * Only ever called after the matching collection has already
 * succeeded — never disburse money that hasn't actually been received.
 */
async function disburse({ amount, currency, phoneNumber, reference, note }) {
  if (!isDisbursementConfigured()) throw notConfiguredError("disbursements");

  const accessToken = await getAccessToken("disbursement");
  const referenceId = randomUUID();

  const response = await fetch(`${BASE_URL}/disbursement/v1_0/transfer`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Ocp-Apim-Subscription-Key": process.env.MTN_MOMO_DISBURSEMENT_SUBSCRIPTION_KEY,
      "X-Reference-Id": referenceId,
      "X-Target-Environment": TARGET_ENV,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amount.toFixed(2),
      currency: currency || "GHS",
      externalId: reference,
      payee: { partyIdType: "MSISDN", partyId: toMsisdn(phoneNumber) },
      payerMessage: note || "Rooma payout",
      payeeNote: note || "Rooma payout",
    }),
  });

  if (response.status !== 202) {
    const data = await response.json().catch(() => ({}));
    const err = new Error(data.message || "MTN MoMo failed to send the payout");
    err.code = "PROVIDER_ERROR";
    throw err;
  }

  return { reference: referenceId };
}

async function verifyDisbursement(referenceId) {
  if (!isDisbursementConfigured()) throw notConfiguredError("disbursements");

  const accessToken = await getAccessToken("disbursement");
  const response = await fetch(`${BASE_URL}/disbursement/v1_0/transfer/${referenceId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Ocp-Apim-Subscription-Key": process.env.MTN_MOMO_DISBURSEMENT_SUBSCRIPTION_KEY,
      "X-Target-Environment": TARGET_ENV,
    },
  });

  const data = await response.json();
  return { success: data.status === "SUCCESSFUL", failed: data.status === "FAILED" };
}

module.exports = {
  isConfigured,
  isDisbursementConfigured,
  initiatePayment,
  verifyPayment,
  disburse,
  verifyDisbursement,
};
