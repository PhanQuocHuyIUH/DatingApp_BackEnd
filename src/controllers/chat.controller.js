const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Match = require("../models/Match");
const User = require("../models/User");
const { sendMessageNotification } = require("../services/notification.service");

/**
 * @route   GET /api/chats
 * @desc    Get all conversations for current user
 * @access  Private
 */
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate(
        "participants",
        "name age gender photos bio lastActive isOnline"
      )
      .populate("matchId")
      .sort({ "lastMessage.timestamp": -1 });

    // Format conversations
    const formattedConversations = conversations.map((conv) => {
      const otherUser = conv.participants.find(
        (p) => p._id.toString() !== req.user._id.toString()
      );

      return {
        id: conv._id,
        matchId: conv.matchId._id,
        user: {
          id: otherUser._id,
          name: otherUser.name,
          age: calculateAge(otherUser.dateOfBirth),
          gender: otherUser.gender,
          photos: otherUser.photos,
          bio: otherUser.bio,
          lastActive: otherUser.lastActive,
          isOnline: otherUser.isOnline,
        },
        lastMessage: conv.lastMessage,
        unreadCount: conv.getUnreadCount(req.user._id),
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      count: formattedConversations.length,
      data: {
        conversations: formattedConversations,
      },
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get conversations",
    });
  }
};

/**
 * @route   GET /api/chats/:conversationId/messages
 * @desc    Get messages in a conversation
 * @access  Private
 */
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query; // Pagination

    // Check if conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this conversation",
      });
    }

    // Build query
    const query = {
      conversationId,
      isDeleted: false,
    };

    // Pagination: get messages before a certain timestamp
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Get messages
    const messages = await Message.find(query)
      .populate("sender", "name photos")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Mark messages as read (where current user is receiver)
    await Message.updateMany(
      {
        conversationId,
        receiver: req.user._id,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // Reset unread count
    await conversation.resetUnreadCount(req.user._id);

    res.status(200).json({
      success: true,
      count: messages.length,
      data: {
        messages: messages.reverse(), // Oldest first
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get messages",
    });
  }
};

/**
 * @route   POST /api/chats/:matchId/messages
 * @desc    Send a message
 * @access  Private
 */
/**
 * @route   POST /api/chats/:matchId/messages
 * @desc    Send a message
 * @access  Private
 */
const sendMessage = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { text, type = "text", mediaUrl } = req.body;

    // Validation
    if (type === "text" && !text) {
      return res.status(400).json({
        success: false,
        message: "Text is required for text messages",
      });
    }

    if (["image", "gif", "audio"].includes(type) && !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: "Media URL is required",
      });
    }

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
        message: "Cannot send message to inactive match",
      });
    }

    // Get receiver
    const receiverId = match.getOtherUser(req.user._id);

    // Find or create conversation
    const conversation = await Conversation.findOrCreate(
      req.user._id,
      receiverId,
      matchId
    );

    // Create message
    const message = await Message.create({
      conversationId: conversation._id,
      sender: req.user._id,
      receiver: receiverId,
      type,
      text,
      mediaUrl,
    });

    // Update conversation last message
    conversation.lastMessage = {
      text: type === "text" ? text : `Sent a ${type}`,
      sender: req.user._id,
      timestamp: new Date(),
    };

    // Increment unread count for receiver
    await conversation.incrementUnreadCount(receiverId);

    await conversation.save();

    // Populate sender info
    await message.populate("sender", "name photos");

    // 🔔 SEND PUSH NOTIFICATION
    try {
      // Get receiver user data
      const receiver = await User.findById(receiverId);

      // Check if receiver has push token and notifications enabled
      if (receiver && receiver.pushToken && receiver.notificationSettings?.messages) {
        console.log('📲 Sending push notification to:', receiver.name);
        
        // Prepare notification message
        const notificationBody = type === "text" 
          ? text.substring(0, 100) // Truncate long messages
          : `Sent you ${type === 'image' ? 'an' : 'a'} ${type}`;

        // Send notification
        await sendMessageNotification(
          receiver.pushToken,
          {
            id: req.user._id,
            name: req.user.name,
            conversationId: conversation._id
          },
          notificationBody
        );

        console.log('✅ Push notification sent successfully');
      } else {
        console.log('⚠️ No push notification sent:', {
          hasPushToken: !!receiver?.pushToken,
          notificationsEnabled: receiver?.notificationSettings?.messages
        });
      }
    } catch (notifError) {
      // Don't fail message sending if notification fails
      console.error('❌ Push notification error:', notifError.message);
    }

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(receiverId.toString()).emit("new_message", {
        conversationId: conversation._id,
        message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Message sent",
      data: {
        message,
      },
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

/**
 * @route   DELETE /api/chats/messages/:messageId
 * @desc    Delete a message
 * @access  Private
 */
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Only sender can delete
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      message: "Message deleted",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
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

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
};
