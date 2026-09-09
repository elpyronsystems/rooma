const express = require("express");
const {
  getUsers,
  updateUser,
  getAdminListings,
  getSupportMessages,
  updateSupportMessage,
  getDocuments,
  updateDocument,
  getAnalytics,
} = require("../controllers/admin.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Every route here is admin-only.
router.use(requireAuth, requireRole("admin"));

router.get("/users", getUsers);
router.patch("/users/:id", updateUser);

router.get("/listings", getAdminListings);

router.get("/support-messages", getSupportMessages);
router.patch("/support-messages/:id", updateSupportMessage);

router.get("/documents", getDocuments);
router.patch("/documents/:id", updateDocument);

router.get("/analytics", getAnalytics);

module.exports = router;
