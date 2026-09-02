const { S3Client } = require("@aws-sdk/client-s3");

// Single shared S3 client, reused across requests.
// AWS_SESSION_TOKEN is only required when using temporary credentials
// (e.g. AWS SSO / STS — access keys starting with "ASIA" rather than "AKIA").
// It's safe to leave undefined when using permanent IAM user keys.
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
  },
});

module.exports = s3Client;
