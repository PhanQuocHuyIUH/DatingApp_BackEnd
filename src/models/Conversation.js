const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    // Participants (always 2 users in dating app)
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // Related match
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },

    // Last message info (for listing)
    lastMessage: {
      text: String,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      timestamp: Date,
    },

    // Unread count for each user
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: participants pair
conversationSchema.index({ participants: 1 }, { unique: true });
conversationSchema.index({ matchId: 1 });

// Method: Get other participant
conversationSchema.methods.getOtherParticipant = function (userId) {
  return this.participants.find((p) => p.toString() !== userId.toString());
};

// Method: Get unread count for user
conversationSchema.methods.getUnreadCount = function (userId) {
  return this.unreadCount.get(userId.toString()) || 0;
};

// Method: Reset unread count for user
conversationSchema.methods.resetUnreadCount = async function (userId) {
  this.unreadCount.set(userId.toString(), 0);
  await this.save();
};

// Method: Increment unread count for user
conversationSchema.methods.incrementUnreadCount = async function (userId) {
  const currentCount = this.getUnreadCount(userId);
  this.unreadCount.set(userId.toString(), currentCount + 1);
  await this.save();
};

// ✅ Static: Find or create conversation (FIXED)
conversationSchema.statics.findOrCreate = async function (
  user1Id,
  user2Id,
  matchId
) {
  try {
    // Convert to ObjectId if needed
    const id1 = mongoose.Types.ObjectId.isValid(user1Id)
      ? new mongoose.Types.ObjectId(user1Id)
      : user1Id;
    const id2 = mongoose.Types.ObjectId.isValid(user2Id)
      ? new mongoose.Types.ObjectId(user2Id)
      : user2Id;

    // Sort participants to ensure consistency
    const sortedParticipants = [id1, id2].sort((a, b) => {
      return a.toString().localeCompare(b.toString());
    });

    console.log(
      "🔍 Finding/Creating conversation for:",
      sortedParticipants.map((id) => id.toString())
    );

    // Try to find existing conversation
    let conversation = await this.findOne({
      participants: { $all: sortedParticipants },
    });

    if (conversation) {
      console.log("✅ Conversation exists:", conversation._id.toString());
      return conversation;
    }

    // Create new conversation
    conversation = await this.create({
      participants: sortedParticipants,
      matchId,
      unreadCount: {
        [id1.toString()]: 0,
        [id2.toString()]: 0,
      },
    });

    console.log("✅ New conversation created:", conversation._id.toString());
    return conversation;
  } catch (error) {
    console.error("❌ Find/Create conversation error:", error);

    // If duplicate key error, try to find existing
    if (error.code === 11000) {
      console.log("⚠️ Duplicate key, searching for existing conversation...");

      const id1 = mongoose.Types.ObjectId.isValid(user1Id)
        ? new mongoose.Types.ObjectId(user1Id)
        : user1Id;
      const id2 = mongoose.Types.ObjectId.isValid(user2Id)
        ? new mongoose.Types.ObjectId(user2Id)
        : user2Id;

      const sortedParticipants = [id1, id2].sort((a, b) => {
        return a.toString().localeCompare(b.toString());
      });

      const conversation = await this.findOne({
        participants: { $all: sortedParticipants },
      });

      if (conversation) {
        console.log(
          "✅ Found existing conversation:",
          conversation._id.toString()
        );
        return conversation;
      }
    }

    throw error;
  }
};

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
