const express = require("express");
const router = express.Router();
const {
  getMatches,
  getMatchById,
  unmatch,
  checkMatchWithUser,
  createMatchConversation,
} = require("../controllers/match.controller");
const { protect } = require("../middleware/auth.middleware");

// All routes are protected
router.use(protect);

// Get all matches
router.get("/", getMatches);

// Check if matched with user (must come before /:matchId)
router.get("/check/:userId", checkMatchWithUser);

// Get single match
router.get("/:matchId", getMatchById);

// Create conversation for match
router.post("/:matchId/conversation", createMatchConversation);

// Unmatch
router.delete("/:matchId", unmatch);

module.exports = router;
