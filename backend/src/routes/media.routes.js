const express = require("express");
const { uploadMedia, deleteMedia, reorderMedia, setCoverMedia } = require("../controllers/media.controller");
const { requireAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

// mergeParams lets this router read :listingId from the parent mount path
const router = express.Router({ mergeParams: true });

router.post("/", requireAuth, upload.array("files", 10), uploadMedia);
router.patch("/reorder", requireAuth, reorderMedia);
router.patch("/:mediaId/cover", requireAuth, setCoverMedia);
router.delete("/:mediaId", requireAuth, deleteMedia);

module.exports = router;
