// Images and short videos only, per the roadmap's "pictures and short
// videos of listings" requirement.
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime", // .mov
];

// 50MB covers a short video comfortably without letting someone upload
// huge files that blow up storage costs.
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

module.exports = { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES };
