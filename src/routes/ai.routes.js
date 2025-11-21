const express = require("express");
const router = express.Router();
const {
  getChatSuggestions,
  getIceBreakerSuggestions,
  getCustomSuggestion,
} = require("../controllers/ai.controller");
const { protect } = require("../middleware/auth.middleware");

// All routes are protected
router.use(protect);

// Get chat suggestions based on conversation
router.get("/suggestions/:conversationId", getChatSuggestions);

// Get ice breaker suggestions for new match
router.get("/ice-breakers/:matchId", getIceBreakerSuggestions);

// Get custom suggestion with user prompt
router.post("/custom-suggestion", getCustomSuggestion);

module.exports = router;
