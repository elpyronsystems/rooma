const express = require("express");
const {
  getUsers,
  updateUser,
  deleteUser,
  getAdminListings,
  getSupportMessages,
  updateSupportMessage,
  getDocuments,
  updateDocument,
  getAnalytics,
} = require("../controllers/admin.controller");
const { getPlatformPayoutSettings, updatePlatformPayoutSettings } = require("../controllers/payout.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { payoutSettingsSchema } = require("../validators/payout.validators");

const router = express.Router();

// Every route here is admin-only.
router.use(requireAuth, requireRole("admin"));

router.get("/users", getUsers);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

router.get("/listings", getAdminListings);

router.get("/support-messages", getSupportMessages);
router.patch("/support-messages/:id", updateSupportMessage);

router.get("/documents", getDocuments);
router.patch("/documents/:id", updateDocument);

router.get("/analytics", getAnalytics);

router.get("/payout-settings", getPlatformPayoutSettings);
router.patch("/payout-settings", validate(payoutSettingsSchema), updatePlatformPayoutSettings);

module.exports = router;
