const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const Match = require("../models/Match");
const User = require("../models/User");
const {
  generateChatSuggestions,
  generateIceBreakerSuggestions,
} = require("../services/ai.service");

/**
 * @route   GET /api/ai/suggestions/:conversationId
 * @desc    Get AI chat suggestions based on conversation context
 * @access  Private
 */
const getChatSuggestions = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 15 } = req.query; // Default: last 15 messages

    // Get conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Check if user is part of conversation
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this conversation",
      });
    }

    // Get other user
    const otherUserId = conversation.getOtherParticipant(req.user._id);
    const otherUser = await User.findById(otherUserId).select(
      "name age bio occupation interests location photos"
    );

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: "Other user not found",
      });
    }

    // Get recent messages (last 10-20)
    const messages = await Message.find({
      conversationId,
      isDeleted: false,
    })
      .populate("sender", "name")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Reverse to get chronological order
    const orderedMessages = messages.reverse();

    // Get current user with details
    const currentUser = await User.findById(req.user._id).select(
      "name age bio occupation interests location photos"
    );

    let suggestions;

    if (orderedMessages.length === 0) {
      // No messages yet - generate ice breakers
      console.log("📝 Generating ice breaker suggestions...");
      suggestions = await generateIceBreakerSuggestions(currentUser, otherUser);
    } else {
      // Has messages - generate reply suggestions
      console.log("📝 Generating chat suggestions...");
      suggestions = await generateChatSuggestions(
        orderedMessages,
        currentUser,
        otherUser
      );
    }

    res.status(200).json({
      success: true,
      data: {
        suggestions,
        context: {
          conversationId,
          messagesAnalyzed: orderedMessages.length,
          otherUser: {
            id: otherUser._id,
            name: otherUser.name,
          },
        },
      },
    });
  } catch (error) {
    console.error("Get chat suggestions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get suggestions",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/ai/ice-breakers/:matchId
 * @desc    Get AI ice breaker suggestions for a new match
 * @access  Private
 */
const getIceBreakerSuggestions = async (req, res) => {
  try {
    const { matchId } = req.params;

    // Get match
    const match = await Match.findById(matchId).populate(
      "users",
      "name age bio occupation interests location photos"
    );

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    // Check if user is part of match
    if (!match.includesUser(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this match",
      });
    }

    // Get current user and other user
    const currentUser = match.users.find(
      (u) => u._id.toString() === req.user._id.toString()
    );
    const otherUser = match.users.find(
      (u) => u._id.toString() !== req.user._id.toString()
    );

    console.log("📝 Generating ice breaker suggestions for match...");
    const suggestions = await generateIceBreakerSuggestions(
      currentUser,
      otherUser
    );

    res.status(200).json({
      success: true,
      data: {
        suggestions,
        context: {
          matchId,
          otherUser: {
            id: otherUser._id,
            name: otherUser.name,
            interests: otherUser.interests,
          },
        },
      },
    });
  } catch (error) {
    console.error("Get ice breaker suggestions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get ice breakers",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/ai/custom-suggestion
 * @desc    Get custom AI suggestion based on user input
 * @access  Private
 */
const getCustomSuggestion = async (req, res) => {
  try {
    const { conversationId, userPrompt } = req.body;

    if (!conversationId || !userPrompt) {
      return res.status(400).json({
        success: false,
        message: "conversationId and userPrompt are required",
      });
    }

    // Get conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Check if user is part of conversation
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this conversation",
      });
    }

    // Get recent messages
    const messages = await Message.find({
      conversationId,
      isDeleted: false,
    })
      .populate("sender", "name")
      .sort({ createdAt: -1 })
      .limit(15);

    const orderedMessages = messages.reverse();

    // Get other user
    const otherUserId = conversation.getOtherParticipant(req.user._id);
    const otherUser = await User.findById(otherUserId).select(
      "name age bio occupation interests"
    );

    // Get current user
    const currentUser = await User.findById(req.user._id).select(
      "name age bio occupation interests"
    );

    // Build context
    const conversationContext = orderedMessages
      .map((msg) => {
        const isCurrentUser =
          msg.sender._id.toString() === currentUser._id.toString();
        const senderName = isCurrentUser ? currentUser.name : otherUser.name;
        return `${senderName}: ${msg.text}`;
      })
      .join("\n");

    // Call OpenAI with custom prompt
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Bạn là trợ lý hẹn hò. Giúp ${
            currentUser.name
          } trả lời trong cuộc trò chuyện với ${otherUser.name}.
          
            Lịch sử chat gần đây:
            ${conversationContext}

            Thông tin ${otherUser.name}: ${
            otherUser.bio || "Không có"
          }, Sở thích: ${otherUser.interests?.join(", ") || "Không có"}`,
        },
        {
          role: "user",
          content: `Yêu cầu của người dùng: ${userPrompt}\n\nHãy đưa ra 1 câu trả lời phù hợp, tự nhiên và lôi cuốn.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    const suggestion = response.choices[0].message.content;

    res.status(200).json({
      success: true,
      data: {
        suggestion,
        context: {
          userPrompt,
          conversationId,
        },
      },
    });
  } catch (error) {
    console.error("Custom suggestion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get custom suggestion",
      error: error.message,
    });
  }
};

module.exports = {
  getChatSuggestions,
  getIceBreakerSuggestions,
  getCustomSuggestion,
};
