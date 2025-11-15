const User = require("../models/User");
const Swipe = require("../models/Swipe");
const Match = require("../models/Match");
const {
  getProfilesToSwipe,
  checkMatch,
  getUsersWhoLikedMe,
} = require("../services/matching.service");

/**
 * @route   GET /api/discovery/profiles
 * @desc    Get profiles to swipe
 * @access  Private
 */
const getProfiles = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const profiles = await getProfilesToSwipe(req.user._id, parseInt(limit));

    res.status(200).json({
      success: true,
      count: profiles.length,
      data: {
        profiles,
      },
    });
  } catch (error) {
    console.error("Get profiles error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profiles",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/discovery/swipe
 * @desc    Swipe left/right on a profile
 * @access  Private
 */
const swipe = async (req, res) => {
  try {
    const { targetUserId, action } = req.body;

    console.log("📍 Swipe request:", {
      userId: req.user._id.toString(),
      targetUserId,
      action,
    });

    // Validation
    if (!targetUserId || !action) {
      return res.status(400).json({
        success: false,
        message: "Please provide targetUserId and action",
      });
    }

    if (!["like", "pass", "superlike"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be: like, pass, or superlike",
      });
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    // Check if already swiped
    const existingSwipe = await Swipe.findOne({
      userId: req.user._id,
      targetUserId,
    });

    if (existingSwipe) {
      return res.status(400).json({
        success: false,
        message: "You have already swiped on this user",
      });
    }

    // Cannot swipe on yourself
    if (req.user._id.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Cannot swipe on yourself",
      });
    }

    // Create swipe record
    const swipe = await Swipe.create({
      userId: req.user._id,
      targetUserId,
      action,
    });

    console.log("✅ Swipe created:", swipe._id);

    // Check if it's a match (only for like/superlike)
    let isMatch = false;
    let matchData = null;

    if (action === "like" || action === "superlike") {
      console.log("🔍 Checking for match...");
      isMatch = await checkMatch(req.user._id, targetUserId);
      console.log("Match result:", isMatch);

      if (isMatch) {
        try {
          console.log("💕 Creating match...");

          // Create match record
          let match = await Match.createMatch(req.user._id, targetUserId);

          console.log("Match created:", match);

          if (!match) {
            console.error("❌ Match.createMatch returned null");
            // Try to find existing match as fallback
            match = await Match.findMatchBetweenUsers(
              req.user._id,
              targetUserId
            );
          }

          if (match) {
            // Populate user data
            match = await Match.findById(match._id).populate(
              "users",
              "name age gender photos bio occupation"
            );

            console.log("✅ Match populated:", match);

            matchData = {
              id: match._id,
              users: match.users,
              matchedAt: match.matchedAt,
            };
          } else {
            console.error("❌ Could not create or find match");
          }
        } catch (matchError) {
          console.error("❌ Match creation error:", matchError);
          // Don't fail the swipe if match creation fails
        }
      }
    }

    res.status(200).json({
      success: true,
      message: isMatch ? "It's a match! 🎉" : "Swipe recorded",
      data: {
        swipe: {
          id: swipe._id,
          action,
          targetUserId,
          swipedAt: swipe.swipedAt,
        },
        isMatch,
        match: matchData,
      },
    });
  } catch (error) {
    console.error("❌ Swipe error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to swipe",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/discovery/likes
 * @desc    Get users who liked me
 * @access  Private
 */
const getLikes = async (req, res) => {
  try {
    const users = await getUsersWhoLikedMe(req.user._id);

    res.status(200).json({
      success: true,
      count: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    console.error("Get likes error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get likes",
    });
  }
};

/**
 * @route   GET /api/discovery/swipe-history
 * @desc    Get my swipe history
 * @access  Private
 */
const getSwipeHistory = async (req, res) => {
  try {
    const { action } = req.query; // Filter by action: like, pass, superlike

    const query = { userId: req.user._id };
    if (action) {
      query.action = action;
    }

    const swipes = await Swipe.find(query)
      .populate("targetUserId", "name age gender photos bio")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: swipes.length,
      data: {
        swipes,
      },
    });
  } catch (error) {
    console.error("Get swipe history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get swipe history",
    });
  }
};

module.exports = {
  getProfiles,
  swipe,
  getLikes,
  getSwipeHistory,
};
