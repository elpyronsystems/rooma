const multer = require("multer");
const { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } = require("../utils/mediaTypes");

// Files are held in memory briefly, then streamed straight to S3 —
// nothing is written to disk on our server.
const storage = multer.memoryStorage();

// This checks the *declared* Content-Type on the upload — a fast, cheap
// first filter. It's not sufficient on its own (a malicious upload can
// simply lie about its mimetype), so the real check on actual file bytes
// happens separately in media.controller.js via file-type. This filter
// just rejects obviously-wrong uploads early, before we even buffer them.
function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error("Unsupported file type. Only JPEG, PNG, WEBP images and MP4/MOV videos are allowed."));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

module.exports = upload;
