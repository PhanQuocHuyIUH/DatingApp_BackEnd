const User = require("../models/User");
const Swipe = require("../models/Swipe");
const Match = require("../models/Match");
const {
  getProfilesToSwipe,
  checkMatch,
  getUsersWhoLikedMe,
} = require("../services/matching.service");
const {
  sendMatchNotification,
  sendLikeNotification,
  sendSuperLikeNotification,
} = require("../services/notification.service");

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

    // Check for match and send notifications
    let isMatch = false;
    let matchData = null;
    // Send notification for like/superlike
    if (action === "like" || action === "superlike") {
      const targetUser = await User.findById(targetUserId);

      // Check if target user has notifications enabled
      if (targetUser.pushToken && targetUser.notificationSettings?.likes) {
        try {
          if (action === "superlike") {
            await sendSuperLikeNotification(targetUser.pushToken, {
              id: req.user._id,
              name: req.user.name,
            });
          } else {
            await sendLikeNotification(targetUser.pushToken, {
              id: req.user._id,
              name: req.user.name,
            });
          }
        } catch (notifError) {
          console.error("❌ Notification send error:", notifError);
          // Don't fail swipe if notification fails
        }
      }

      // Check for match
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

        // Send match notification to both users
        if (targetUser.pushToken && targetUser.notificationSettings?.matches) {
          try {
            await sendMatchNotification(targetUser.pushToken, {
              id: req.user._id,
              name: req.user.name,
            });
          } catch (notifError) {
            console.error("❌ Match notification error:", notifError);
          }
        }

        // Send to current user too
        if (req.user.pushToken && req.user.notificationSettings?.matches) {
          try {
            await sendMatchNotification(req.user.pushToken, {
              id: targetUser._id,
              name: targetUser.name,
            });
          } catch (notifError) {
            console.error("❌ Match notification error:", notifError);
          }
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

/**
 * @route   GET /api/discovery/getLikeSwiped
 * @desc    Get profiles of users I have liked (including superlikes)
 * @access  Private
 */
const getLikeSwiped = async (req, res) => {
  try {
    // Pagination
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Find swipes performed by current user where action is like or superlike
    const actions = ["like", "superlike"];

    const swipes = await Swipe.find({
      userId: req.user._id,
      action: { $in: actions },
    })
      .populate(
        "targetUserId",
        "name age gender photos bio occupation location pushToken notificationSettings"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Map to user profiles (populate gives us the user document under targetUserId)
    const profiles = swipes.map((s) => s.targetUserId).filter(Boolean);

    res.status(200).json({
      success: true,
      count: profiles.length,
      page,
      limit,
      data: { profiles },
    });
  } catch (error) {
    console.error("Get liked/swiped profiles error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get liked profiles",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/discovery/filter
 * @desc    Filter profiles with custom parameters
 * @access  Private
 * @query   {
 *   ageMin: number,
 *   ageMax: number,
 *   gender: string (male|female|nonbinary),
 *   city: string,
 *   state: string,
 *   country: string,
 *   interests: string (comma-separated),
 *   languages: string (comma-separated),
 *   keyword: string (search in name/bio),
 *   limit: number (default 20),
 *   page: number (default 1)
 * }
 */
const filterProfiles = async (req, res) => {
  try {
    const {
      ageMin,
      ageMax,
      gender,
      city,
      state,
      country,
      interests,
      languages,
      keyword,
      limit = 20,
      page = 1,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query filter
    const query = {};

    // Age range filter
    if (ageMin || ageMax) {
      query.dateOfBirth = {};

      if (ageMax) {
        // ageMax means born after: today - ageMax years
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() - parseInt(ageMax));
        query.dateOfBirth.$gte = maxDate;
      }

      if (ageMin) {
        // ageMin means born before: today - ageMin years
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - parseInt(ageMin));
        query.dateOfBirth.$lte = minDate;
      }
    }

    // Gender filter
    if (gender) {
      query.gender = gender;
    }

    // Location filter
    if (city) {
      query["location.city"] = new RegExp(city, "i");
    }
    if (state) {
      query["location.state"] = new RegExp(state, "i");
    }
    if (country) {
      query["location.country"] = new RegExp(country, "i");
    }

    // Interests filter (match any)
    if (interests) {
      const interestList = interests.split(",").map((i) => i.trim());
      query.interests = { $in: interestList };
    }

    // Languages filter (match any)
    if (languages) {
      const languageList = languages.split(",").map((l) => l.trim());
      query.languages = { $in: languageList };
    }

    // Keyword filter (search in name or bio)
    if (keyword) {
      query.$or = [
        { name: new RegExp(keyword, "i") },
        { bio: new RegExp(keyword, "i") },
      ];
    }

    // Exclude current user and already swiped users
    query._id = { $ne: req.user._id };

    // Get already swiped user IDs
    const swipedUsers = await Swipe.find({ userId: req.user._id }).select(
      "targetUserId"
    );
    const swipedUserIds = swipedUsers.map((s) => s.targetUserId.toString());
    query._id.$nin = swipedUserIds;

    // Execute query with pagination
    const profiles = await User.find(query)
      .select(
        "name age gender photos bio occupation education company interests languages location lastActive isOnline"
      )
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination info
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: profiles.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      limit: parseInt(limit),
      data: {
        profiles,
      },
    });
  } catch (error) {
    console.error("Filter profiles error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to filter profiles",
      error: error.message,
    });
  }
};

module.exports = {
  getProfiles,
  swipe,
  getLikes,
  getSwipeHistory,
  getLikeSwiped,
  filterProfiles,
};
