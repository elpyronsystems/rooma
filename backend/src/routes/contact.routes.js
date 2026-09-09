const express = require("express");
const { getMyContact, updateMyContact } = require("../controllers/contact.controller");
const { requireAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { updateContactSchema } = require("../validators/contact.validators");

const router = express.Router();

router.get("/me", requireAuth, getMyContact);
router.patch("/me", requireAuth, validate(updateContactSchema), updateMyContact);

module.exports = router;
