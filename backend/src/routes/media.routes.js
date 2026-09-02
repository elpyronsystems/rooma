const express = require("express");
const { uploadMedia, deleteMedia } = require("../controllers/media.controller");
const { requireAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

// mergeParams lets this router read :listingId from the parent mount path
const router = express.Router({ mergeParams: true });

router.post("/", requireAuth, upload.array("files", 10), uploadMedia);
router.delete("/:mediaId", requireAuth, deleteMedia);

module.exports = router;
