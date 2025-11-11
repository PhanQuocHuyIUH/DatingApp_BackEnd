const express = require("express");
const router = express.Router();
const {
  getProfiles,
  swipe,
  getLikes,
  getSwipeHistory,
} = require("../controllers/discovery.controller");
const { protect } = require("../middleware/auth.middleware");

// All routes are protected
router.use(protect);

// Get profiles to swipe
router.get("/profiles", getProfiles);

// Swipe on a profile
router.post("/swipe", swipe);

// Get users who liked me
router.get("/likes", getLikes);

// Get my swipe history
router.get("/swipe-history", getSwipeHistory);

module.exports = router;
