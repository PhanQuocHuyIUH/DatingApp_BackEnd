const Match = require("../models/Match");
const User = require("../models/User");
const Conversation = require("../models/Conversation");

/**
 * @route   GET /api/matches
 * @desc    Get all matches for current user
 * @access  Private
 */
const getMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      users: req.user._id,
      status: "active",
    })
      .populate(
        "users",
        "name age gender photos bio occupation location lastActive isOnline"
      )
      .sort({ matchedAt: -1 });

    // Format matches to show the other user
    const formattedMatches = matches.map((match) => {
      const otherUser = match.users.find(
        (user) => user._id.toString() !== req.user._id.toString()
      );

      return {
        id: match._id,
        matchedAt: match.matchedAt,
        user: {
          id: otherUser._id,
          name: otherUser.name,
          age: calculateAge(otherUser.dateOfBirth),
          gender: otherUser.gender,
          photos: otherUser.photos,
          bio: otherUser.bio,
          occupation: otherUser.occupation,
          location: otherUser.location,
          lastActive: otherUser.lastActive,
          isOnline: otherUser.isOnline,
        },
      };
    });

    res.status(200).json({
      success: true,
      count: formattedMatches.length,
      data: {
        matches: formattedMatches,
      },
    });
  } catch (error) {
    console.error("Get matches error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get matches",
    });
  }
};

/**
 * @route   GET /api/matches/:matchId
 * @desc    Get single match details
 * @access  Private
 */
const getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId).populate(
      "users",
      "name age gender photos bio occupation education interests languages location lastActive isOnline"
    );

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    // Check if user is part of this match
    if (!match.includesUser(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this match",
      });
    }

    // Get the other user
    const otherUser = match.getOtherUser(req.user._id);
    const otherUserData = match.users.find(
      (user) => user._id.toString() === otherUser.toString()
    );

    res.status(200).json({
      success: true,
      data: {
        match: {
          id: match._id,
          matchedAt: match.matchedAt,
          status: match.status,
          user: {
            id: otherUserData._id,
            name: otherUserData.name,
            age: calculateAge(otherUserData.dateOfBirth),
            gender: otherUserData.gender,
            photos: otherUserData.photos,
            bio: otherUserData.bio,
            occupation: otherUserData.occupation,
            education: otherUserData.education,
            interests: otherUserData.interests,
            languages: otherUserData.languages,
            location: otherUserData.location,
            lastActive: otherUserData.lastActive,
            isOnline: otherUserData.isOnline,
          },
        },
      },
    });
  } catch (error) {
    console.error("Get match error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get match",
    });
  }
};

/**
 * @route   DELETE /api/matches/:matchId
 * @desc    Unmatch with a user
 * @access  Private
 */
const unmatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    // Check if user is part of this match
    if (!match.includesUser(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this match",
      });
    }

    // Check if already unmatched
    if (match.status === "unmatched") {
      return res.status(400).json({
        success: false,
        message: "Already unmatched",
      });
    }

    // Update match status
    match.status = "unmatched";
    match.unmatchedBy = req.user._id;
    match.unmatchedAt = new Date();
    await match.save();

    res.status(200).json({
      success: true,
      message: "Successfully unmatched",
    });
  } catch (error) {
    console.error("Unmatch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unmatch",
    });
  }
};

/**
 * @route   GET /api/matches/check/:userId
 * @desc    Check if matched with a specific user
 * @access  Private
 */
const checkMatchWithUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const match = await Match.findMatchBetweenUsers(req.user._id, userId);

    res.status(200).json({
      success: true,
      data: {
        isMatched: !!match,
        match: match
          ? {
              id: match._id,
              matchedAt: match.matchedAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Check match error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check match",
    });
  }
};

/**
 * Helper: Calculate age
 */
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

/**
 * @route   POST /api/matches/:matchId/conversation
 * @desc    Create conversation for a match
 * @access  Private
 */
const createMatchConversation = async (req, res) => {
  try {
    const { matchId } = req.params;

    // Check if match exists and user is part of it
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    if (!match.includesUser(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this match",
      });
    }

    if (match.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Cannot create conversation for inactive match",
      });
    }

    // Get the other user
    const otherUserId = match.getOtherUser(req.user._id);

    // Create or find conversation
    const conversation = await Conversation.findOrCreate(
      req.user._id,
      otherUserId,
      matchId
    );

    // Populate participants
    await conversation.populate(
      "participants",
      "name age gender photos bio lastActive isOnline"
    );

    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: {
        conversation: {
          id: conversation._id,
          matchId: conversation.matchId,
          participants: conversation.participants,
          createdAt: conversation.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Create match conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create conversation",
      error: error.message,
    });
  }
};

module.exports = {
  getMatches,
  getMatchById,
  unmatch,
  checkMatchWithUser,
  createMatchConversation,
};
