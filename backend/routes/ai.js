const express = require("express");
const router  = express.Router();
// Note: protect is already applied in server.js for /api/ai
const ctrl = require("../controllers/aiController");

router.get("/suggestions", ctrl.getProductivitySuggestions);
router.get("/predictions",  ctrl.getPredictions);
router.post("/ask",         ctrl.askAssistant);

module.exports = router;
