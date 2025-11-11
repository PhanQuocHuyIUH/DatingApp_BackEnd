const mongoose = require("mongoose");

const swipeSchema = new mongoose.Schema(
  {
    // User who swiped
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // User who was swiped on
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Swipe action
    action: {
      type: String,
      enum: ["like", "pass", "superlike"],
      required: true,
    },

    // Optional: Swipe metadata
    swipedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: một user chỉ có thể swipe 1 lần cho 1 target
swipeSchema.index({ userId: 1, targetUserId: 1 }, { unique: true });

// Index for queries
swipeSchema.index({ userId: 1, action: 1 });
swipeSchema.index({ targetUserId: 1, action: 1 });

const Swipe = mongoose.model("Swipe", swipeSchema);

module.exports = Swipe;
