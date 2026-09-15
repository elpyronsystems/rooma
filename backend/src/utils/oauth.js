const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

// Both Google and Microsoft issue standard OpenID Connect ID tokens
// signed with RS256, verifiable against their published public keys
// (JWKS). One shared verifier handles both — only the JWKS endpoint,
// issuer check, and expected audience (our own app's Client ID) differ
// per provider.
const PROVIDERS = {
  google: {
    jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
    isValidIssuer: (iss) => iss === "https://accounts.google.com" || iss === "accounts.google.com",
    clientIdEnvVar: "GOOGLE_CLIENT_ID",
  },
  microsoft: {
    jwksUri: "https://login.microsoftonline.com/common/discovery/v2.0/keys",
    // Multi-tenant Microsoft apps issue tokens with the signed-in
    // user's actual tenant id in the issuer URL, not the literal word
    // "common" — so this checks the URL shape rather than an exact
    // string match.
    isValidIssuer: (iss) => /^https:\/\/login\.microsoftonline\.com\/[^/]+\/v2\.0$/.test(iss),
    clientIdEnvVar: "MICROSOFT_CLIENT_ID",
  },
};

const jwksClients = {};
function getJwksClientFor(provider) {
  if (!jwksClients[provider]) {
    jwksClients[provider] = jwksClient({ jwksUri: PROVIDERS[provider].jwksUri, cache: true, rateLimit: true });
  }
  return jwksClients[provider];
}

function getSigningKey(provider) {
  return (header, callback) => {
    getJwksClientFor(provider).getSigningKey(header.kid, (err, key) => {
      if (err) return callback(err);
      callback(null, key.getPublicKey());
    });
  };
}

/**
 * Verifies an OIDC ID token from Google or Microsoft: checks the
 * signature against the provider's live public keys, confirms the
 * audience matches our own registered Client ID (proving the token was
 * actually issued for this app, not phished from another one), and
 * confirms the issuer is genuinely that provider. Resolves with the
 * token's decoded payload (sub, email, email_verified, name, ...) or
 * rejects if anything doesn't check out.
 */
function verifyOAuthIdToken(provider, idToken) {
  return new Promise((resolve, reject) => {
    const config = PROVIDERS[provider];
    if (!config) return reject(new Error("Unsupported provider"));

    const clientId = process.env[config.clientIdEnvVar];
    if (!clientId) return reject(new Error(`${config.clientIdEnvVar} is not configured on this server`));

    jwt.verify(idToken, getSigningKey(provider), { algorithms: ["RS256"], audience: clientId }, (err, payload) => {
      if (err) return reject(err);
      if (!config.isValidIssuer(payload.iss)) return reject(new Error("Unexpected token issuer"));
      resolve(payload);
    });
  });
}

module.exports = { verifyOAuthIdToken };
