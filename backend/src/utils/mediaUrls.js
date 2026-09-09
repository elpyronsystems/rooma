const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3Client = require("../config/s3");

// How long a signed URL stays valid before it needs to be re-generated.
// 1 hour is enough for someone to browse a listing and view its photos;
// URLs are re-signed fresh every time a listing is fetched, so this never
// actually runs out on someone mid-session.
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

/**
 * Some media rows were created before this project switched to signed
 * URLs and still store a full https:// URL instead of a bare S3 key
 * (from the earlier public-bucket-URL approach). This normalizes either
 * format down to the raw key S3 actually needs, so those older rows
 * keep working instead of producing a broken image link.
 */
function extractKey(storedValue) {
  if (storedValue.startsWith("http://") || storedValue.startsWith("https://")) {
    try {
      const url = new URL(storedValue);
      return decodeURIComponent(url.pathname.replace(/^\//, ""));
    } catch {
      return storedValue;
    }
  }
  return storedValue;
}

/**
 * Generates a temporary signed GET URL for one S3 object key. Used instead
 * of a permanent public URL because the bucket may not (and often should
 * not) be configured for public access — this works regardless of that
 * setting, and is the more secure default.
 */
async function getSignedMediaUrl(storedValue) {
  const key = extractKey(storedValue);
  const command = new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: SIGNED_URL_EXPIRY_SECONDS });
}

/**
 * Mutates a single listing's `media` array in place, replacing each stored
 * S3 key with a freshly signed URL. Safe to call on a listing that has no
 * media array (e.g. a partial select) — it's a no-op in that case.
 */
async function attachSignedUrlsToListing(listing) {
  if (!listing || !Array.isArray(listing.media)) return listing;

  await Promise.all(
    listing.media.map(async (mediaItem) => {
      mediaItem.url = await getSignedMediaUrl(mediaItem.url);
    })
  );

  return listing;
}

/**
 * Same as above, applied across an array of listings (e.g. search results).
 */
async function attachSignedUrlsToListings(listings) {
  await Promise.all(listings.map((listing) => attachSignedUrlsToListing(listing)));
  return listings;
}

module.exports = { getSignedMediaUrl, attachSignedUrlsToListing, attachSignedUrlsToListings };
