const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    // Two users who matched (MUST BE ARRAY OF 2 IDs)
    users: {
      type: [mongoose.Schema.Types.ObjectId], // ← Array of ObjectIds
      ref: "User",
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length === 2;
        },
        message: "Users must be an array of exactly 2 user IDs",
      },
    },

    matchedAt: {
      type: Date,
      default: Date.now,
    },

    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "unmatched"],
      default: "active",
    },

    unmatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    unmatchedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Index for queries (NO unique constraint on users array)
// This allows each user to have multiple matches
matchSchema.index({ users: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ matchedAt: -1 });

// Custom validation to prevent duplicate matches (same pair)
matchSchema.pre("save", async function (next) {
  if (this.isNew) {
    const existingMatch = await this.constructor.findOne({
      users: { $all: this.users },
      _id: { $ne: this._id },
    });

    if (existingMatch) {
      const error = new Error("Match already exists between these users");
      error.code = 11000; // Mimic duplicate key error
      return next(error);
    }
  }
  next();
});

// Method: Check if user is part of this match
matchSchema.methods.includesUser = function (userId) {
  return this.users.some((user) => user.toString() === userId.toString());
};

// Method: Get the other user in the match
matchSchema.methods.getOtherUser = function (userId) {
  return this.users.find((user) => user.toString() !== userId.toString());
};

// Static method: Create match between two users
matchSchema.statics.createMatch = async function (userId1, userId2) {
  try {
    // Convert to ObjectId if string
    const id1 = mongoose.Types.ObjectId.isValid(userId1)
      ? new mongoose.Types.ObjectId(userId1)
      : userId1;
    const id2 = mongoose.Types.ObjectId.isValid(userId2)
      ? new mongoose.Types.ObjectId(userId2)
      : userId2;

    // Sort to ensure consistency [smaller, larger]
    const sortedUsers = [id1, id2].sort((a, b) => {
      return a.toString().localeCompare(b.toString());
    });

    console.log(
      "🔍 Creating match between:",
      sortedUsers.map((id) => id.toString())
    );

    // Check if match already exists
    let match = await this.findOne({
      users: { $all: sortedUsers },
      status: "active",
    });

    if (match) {
      console.log("✅ Match already exists:", match._id.toString());
      return match;
    }

    // Create new match
    match = await this.create({
      users: sortedUsers,
    });

    console.log("✅ New match created:", match._id.toString());
    return match;
  } catch (error) {
    console.error("❌ Create match error:", error.message);

    // If duplicate key error, try to find existing match
    if (error.code === 11000) {
      console.log("⚠️ Duplicate key error, searching for existing match...");

      const id1 = mongoose.Types.ObjectId.isValid(userId1)
        ? new mongoose.Types.ObjectId(userId1)
        : userId1;
      const id2 = mongoose.Types.ObjectId.isValid(userId2)
        ? new mongoose.Types.ObjectId(userId2)
        : userId2;

      const sortedUsers = [id1, id2].sort((a, b) => {
        return a.toString().localeCompare(b.toString());
      });

      const match = await this.findOne({
        users: { $all: sortedUsers },
      });

      if (match) {
        console.log("✅ Found existing match:", match._id.toString());
        return match;
      }

      console.error(
        "❌ Could not find existing match after duplicate key error"
      );
      return null;
    }

    throw error;
  }
};

// Static method: Find match between two users
matchSchema.statics.findMatchBetweenUsers = async function (userId1, userId2) {
  const id1 = mongoose.Types.ObjectId.isValid(userId1)
    ? new mongoose.Types.ObjectId(userId1)
    : userId1;
  const id2 = mongoose.Types.ObjectId.isValid(userId2)
    ? new mongoose.Types.ObjectId(userId2)
    : userId2;

  return await this.findOne({
    users: { $all: [id1, id2] },
    status: "active",
  });
};

const Match = mongoose.model("Match", matchSchema);

module.exports = Match;
