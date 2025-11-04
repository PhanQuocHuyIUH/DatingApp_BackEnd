const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // Authentication
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },

    // Basic Info
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "nonbinary"],
      required: true,
    },
    pronouns: {
      type: String,
      enum: ["he/him", "she/her", "they/them", "other"],
    },

    // Photos
    photos: [
      {
        url: String,
        publicId: String,
        isMain: { type: Boolean, default: false },
      },
    ],

    // Profile Details
    bio: {
      type: String,
      maxlength: 500,
    },
    occupation: String,
    education: String,
    company: String,

    // Location (simplified)
    location: {
      city: String,
      state: String,
      country: String,
      coordinates: [Number], // [longitude, latitude]
    },

    // Interests
    interests: [String],
    languages: [String],

    // Activity
    lastActive: {
      type: Date,
      default: Date.now,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },

    // Auth Provider
    authProvider: {
      type: String,
      enum: ["email", "apple", "facebook", "google"],
      default: "email",
    },
    appleId: String,
    facebookId: String,
    googleId: String,
  },
  {
    timestamps: true,
  }
);

// Index
userSchema.index({ email: 1 });

// Virtual: age
userSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
});

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Get public profile
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    age: this.age,
    gender: this.gender,
    photos: this.photos,
    bio: this.bio,
    occupation: this.occupation,
    education: this.education,
    company: this.company,
    interests: this.interests,
    languages: this.languages,
    location: this.location,
    lastActive: this.lastActive,
    isOnline: this.isOnline,
  };
};

const User = mongoose.model("User", userSchema);

module.exports = User;
