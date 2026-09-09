const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { randomUUID } = require("crypto");
const { fromBuffer: fileTypeFromBuffer } = require("file-type");
const s3Client = require("../config/s3");
const prisma = require("../config/prisma");
const { ALLOWED_DOCUMENT_TYPES } = require("../utils/mediaTypes");
const { getSignedMediaUrl } = require("../utils/mediaUrls");

const VALID_DOC_TYPES = ["ownership_deed", "land_title", "id_verification", "other"];

function buildS3Key(listingId, detectedExt) {
  return `listings/${listingId}/documents/${randomUUID()}.${detectedExt}`;
}

/**
 * POST /api/listings/:listingId/documents
 * Uploads one or more ownership/verification documents against a listing.
 * Only the listing owner or an admin may do this — and critically, these
 * documents are NEVER returned by the public listing search/detail
 * endpoints (see listings.controller.js). They're private, viewable only
 * by the owner (via GET below) or an admin doing verification.
 */
async function uploadDocuments(req, res, next) {
  try {
    const { listingId } = req.params;
    const docType = req.body.docType;

    if (!VALID_DOC_TYPES.includes(docType)) {
      return res.status(400).json({ error: `docType must be one of: ${VALID_DOC_TYPES.join(", ")}` });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const isOwner = listing.ownerId === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Only the listing owner can add documents to this listing" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files were uploaded. Attach at least one file under the 'files' field." });
    }

    const createdDocs = [];

    for (const file of req.files) {
      // Same real-bytes check as photo uploads — never trust the
      // declared Content-Type alone.
      const detected = await fileTypeFromBuffer(file.buffer);

      if (!detected || !ALLOWED_DOCUMENT_TYPES.includes(detected.mime)) {
        return res.status(400).json({
          error: `Rejected "${file.originalname}": file content does not match an allowed image or PDF type.`,
        });
      }

      const key = buildS3Key(listingId, detected.ext);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: detected.mime,
        })
      );

      const doc = await prisma.listingDocument.create({
        data: {
          listingId,
          docType,
          fileUrl: key, // raw S3 key, signed into a real URL at read time
        },
      });

      doc.fileUrl = await getSignedMediaUrl(key);
      createdDocs.push(doc);
    }

    res.status(201).json(createdDocs);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/listings/:listingId/documents
 * Only the listing owner or an admin can see what's been uploaded —
 * ownership documents are never public.
 */
async function getListingDocuments(req, res, next) {
  try {
    const { listingId } = req.params;

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const isOwner = listing.ownerId === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Only the listing owner can view these documents" });
    }

    const docs = await prisma.listingDocument.findMany({
      where: { listingId },
      orderBy: { uploadedAt: "desc" },
    });

    await Promise.all(
      docs.map(async (doc) => {
        doc.fileUrl = await getSignedMediaUrl(doc.fileUrl);
      })
    );

    res.json(docs);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/listings/:listingId/documents/:documentId
 */
async function deleteDocument(req, res, next) {
  try {
    const { listingId, documentId } = req.params;

    const doc = await prisma.listingDocument.findUnique({ where: { id: documentId } });
    if (!doc || doc.listingId !== listingId) {
      return res.status(404).json({ error: "Document not found for this listing" });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    const isOwner = listing.ownerId === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Only the listing owner can remove documents from this listing" });
    }

    await s3Client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: doc.fileUrl }));
    await prisma.listingDocument.delete({ where: { id: documentId } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadDocuments, getListingDocuments, deleteDocument };
