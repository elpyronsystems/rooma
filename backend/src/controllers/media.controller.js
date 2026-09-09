const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { randomUUID } = require("crypto");
const { fromBuffer: fileTypeFromBuffer } = require("file-type");
const s3Client = require("../config/s3");
const prisma = require("../config/prisma");
const { ALLOWED_MIME_TYPES } = require("../utils/mediaTypes");
const { getSignedMediaUrl } = require("../utils/mediaUrls");

function buildS3Key(listingId, detectedExt) {
  return `listings/${listingId}/${randomUUID()}.${detectedExt}`;
}

/**
 * POST /api/listings/:listingId/media
 * Accepts one or more files (multipart/form-data, field name "files"),
 * uploads each to S3, and records it against the listing.
 * Only the listing owner or an admin may upload media for a listing.
 *
 * The database stores the S3 *key*, not a permanent public URL — the
 * bucket may not have public access enabled (many company AWS accounts
 * block this at the org level as a security guardrail), so every read
 * path signs a temporary URL on demand instead. See utils/mediaUrls.js.
 */
async function uploadMedia(req, res, next) {
  try {
    const { listingId } = req.params;

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const isOwner = listing.ownerId === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Only the listing owner can add media to this listing" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files were uploaded. Attach at least one file under the 'files' field." });
    }

    const createdMedia = [];

    for (const file of req.files) {
      // Multer's fileFilter only checked the *declared* Content-Type, which
      // a malicious client can lie about (e.g. rename a .exe to photo.jpg
      // and set Content-Type: image/jpeg). This inspects the actual file
      // bytes (magic numbers) to confirm what the file really is before
      // it goes anywhere near S3.
      const detected = await fileTypeFromBuffer(file.buffer);

      if (!detected || !ALLOWED_MIME_TYPES.includes(detected.mime)) {
        return res.status(400).json({
          error: `Rejected "${file.originalname}": file content does not match an allowed image or video type.`,
        });
      }

      const key = buildS3Key(listingId, detected.ext);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: detected.mime, // use the verified type, not the client-supplied one
        })
      );

      const mediaType = detected.mime.startsWith("video") ? "video" : "image";

      const media = await prisma.listingMedia.create({
        data: {
          listingId,
          mediaType,
          url: key, // stores the raw S3 key — signed into a real URL at read time
        },
      });

      // The immediate response to this upload should still be directly
      // usable by the frontend, so sign it here even though the DB row
      // only has the bare key.
      media.url = await getSignedMediaUrl(key);
      createdMedia.push(media);
    }

    res.status(201).json(createdMedia);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/listings/:listingId/media/:mediaId
 */
async function deleteMedia(req, res, next) {
  try {
    const { listingId, mediaId } = req.params;

    const media = await prisma.listingMedia.findUnique({ where: { id: mediaId } });
    if (!media || media.listingId !== listingId) {
      return res.status(404).json({ error: "Media not found for this listing" });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    const isOwner = listing.ownerId === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Only the listing owner can remove media from this listing" });
    }

    // media.url is now the raw S3 key itself (not a full URL), since we
    // switched to signed URLs generated on demand rather than storing a
    // permanent public link.
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: media.url })
    );

    await prisma.listingMedia.delete({ where: { id: mediaId } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadMedia, deleteMedia };
