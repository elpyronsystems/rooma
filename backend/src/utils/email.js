const { SendEmailCommand } = require("@aws-sdk/client-ses");
const sesClient = require("../config/ses");

/**
 * Sends the signup verification code by email. This is the primary
 * verification channel while Hubtel SMS remains disconnected — every
 * signup requires an email specifically so this always works, regardless
 * of SMS status.
 *
 * Failures here are logged but never thrown to the caller — a broken
 * email send should not block signup itself; see auth.controller.js for
 * how this is called.
 */
async function sendOtpEmail(toEmail, fullName, code) {
  const senderEmail = process.env.SES_SENDER_EMAIL;

  if (!senderEmail) {
    console.warn("SES_SENDER_EMAIL is not set — skipping OTP email send.");
    return { sent: false, reason: "not_configured" };
  }

  const command = new SendEmailCommand({
    Source: senderEmail,
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Subject: { Data: "Your Rooma verification code" },
      Body: {
        Html: {
          Data: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Rooma</h2>
              <p>Hi ${fullName || "there"},</p>
              <p>Your verification code is:</p>
              <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0f1e3d;">${code}</p>
              <p style="color: #64748b; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        },
        Text: {
          Data: `Hi ${fullName || "there"}, your Rooma verification code is ${code}. This code expires in 10 minutes.`,
        },
      },
    },
  });

  try {
    await sesClient.send(command);
    return { sent: true };
  } catch (err) {
    // Common cause in SES "sandbox" mode: the recipient address hasn't
    // been verified yet. Log clearly so this is easy to diagnose without
    // digging through AWS console logs.
    console.error(`Failed to send OTP email to ${toEmail}:`, err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendOtpEmail };
