const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // Conversation this message belongs to
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    // Sender
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Receiver
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Message type
    type: {
      type: String,
      enum: ["text", "image", "gif", "audio"],
      default: "text",
    },

    // Message content
    text: {
      type: String,
      required: function () {
        return this.type === "text";
      },
    },

    // Media URL (for image/gif/audio)
    mediaUrl: {
      type: String,
      required: function () {
        return ["image", "gif", "audio"].includes(this.type);
      },
    },

    // Read status
    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },

    // Deleted status
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ receiver: 1 });

// Method: Mark as read
messageSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
};

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
