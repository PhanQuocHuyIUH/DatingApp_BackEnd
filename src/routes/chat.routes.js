const express = require("express");
const router = express.Router();
const {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
} = require("../controllers/chat.controller");
const { protect } = require("../middleware/auth.middleware");
const { uploadChatMedia } = require("../middleware/upload.middleware");

// All routes are protected
router.use(protect);

// Get all conversations (must be before /:conversationId routes)
router.get("/", getConversations);

// Create conversation for a match
router.post("/conversation", createConversation);

// Delete message (specific route before param routes)
router.delete("/messages/:messageId", deleteMessage);

// Get messages in a conversation
router.get("/:conversationId/messages", getMessages);

// Send message (by matchId) - with optional media upload
router.post("/:matchId/messages", uploadChatMedia.single("media"), sendMessage);

module.exports = router;
