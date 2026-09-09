const multer = require("multer");
const { ALLOWED_DOCUMENT_TYPES, MAX_FILE_SIZE_BYTES } = require("../utils/mediaTypes");

const storage = multer.memoryStorage();

// Same "declared type is just a first filter" logic as photo uploads —
// the real check on actual file bytes happens in documents.controller.js.
function fileFilter(req, file, cb) {
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    return cb(new Error("Unsupported file type. Only JPEG, PNG, WEBP images and PDF documents are allowed."));
  }
  cb(null, true);
}

const uploadDocument = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

module.exports = uploadDocument;
