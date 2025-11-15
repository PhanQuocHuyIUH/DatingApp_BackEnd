const express = require("express");
const router = express.Router();
const {
  getMatches,
  getMatchById,
  unmatch,
  checkMatchWithUser,
} = require("../controllers/match.controller");
const { protect } = require("../middleware/auth.middleware");

// All routes are protected
router.use(protect);

// Get all matches
router.get("/", getMatches);

// Get single match
router.get("/:matchId", getMatchById);

// Unmatch
router.delete("/:matchId", unmatch);

// Check if matched with user
router.get("/check/:userId", checkMatchWithUser);

module.exports = router;
