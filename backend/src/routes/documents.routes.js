const express = require("express");
const { uploadDocuments, getListingDocuments, deleteDocument } = require("../controllers/documents.controller");
const { requireAuth } = require("../middleware/auth");
const uploadDocument = require("../middleware/uploadDocument");

// mergeParams lets this router read :listingId from the parent mount path
const router = express.Router({ mergeParams: true });

router.get("/", requireAuth, getListingDocuments);
router.post("/", requireAuth, uploadDocument.array("files", 10), uploadDocuments);
router.delete("/:documentId", requireAuth, deleteDocument);

module.exports = router;
