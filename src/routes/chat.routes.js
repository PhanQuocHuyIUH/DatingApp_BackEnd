const express = require("express");
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
} = require("../controllers/chat.controller");
const { protect } = require("../middleware/auth.middleware");

// All routes are protected
router.use(protect);

// Get all conversations
router.get("/", getConversations);

// Get messages in a conversation
router.get("/:conversationId/messages", getMessages);

// Send message (by matchId)
router.post("/:matchId/messages", sendMessage);

// Delete message
router.delete("/messages/:messageId", deleteMessage);

module.exports = router;
