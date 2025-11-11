const User = require("../models/User");
const Swipe = require("../models/Swipe");
const geolib = require("geolib");

/**
 * Get profiles for user to swipe
 * @param {string} userId - Current user ID
 * @param {number} limit - Number of profiles to return
 * @returns {array} Array of user profiles
 */
const getProfilesToSwipe = async (userId, limit = 10) => {
  try {
    const currentUser = await User.findById(userId);

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Get users that current user has already swiped on
    const swipedUsers = await Swipe.find({ userId }).select("targetUserId");
    const swipedUserIds = swipedUsers.map((swipe) =>
      swipe.targetUserId.toString()
    );

    // Add current user to excluded list
    const excludedIds = [...swipedUserIds, userId];

    // Build query
    const query = {
      _id: { $nin: excludedIds },
      gender: { $ne: currentUser.gender }, // Opposite gender (can be customized)
    };

    // Get potential matches
    let profiles = await User.find(query)
      .select(
        "name dateOfBirth gender photos bio occupation education interests languages location"
      )
      .limit(limit * 3); // Get more to filter by distance

    // Calculate age for each profile
    profiles = profiles.map((profile) => {
      const profileObj = profile.toObject();
      profileObj.age = calculateAge(profile.dateOfBirth);
      return profileObj;
    });

    // Filter by distance if both users have location
    if (currentUser.location && currentUser.location.coordinates) {
      profiles = profiles.filter((profile) => {
        if (!profile.location || !profile.location.coordinates) {
          return false;
        }

        const distance = calculateDistance(
          currentUser.location.coordinates,
          profile.location.coordinates
        );

        // Default max distance: 50km
        return distance <= 50;
      });
    }

    // Add distance to each profile
    profiles = profiles.map((profile) => {
      if (
        profile.location &&
        profile.location.coordinates &&
        currentUser.location &&
        currentUser.location.coordinates
      ) {
        profile.distance = calculateDistance(
          currentUser.location.coordinates,
          profile.location.coordinates
        );
      }
      return profile;
    });

    // Sort by distance (closest first)
    profiles.sort((a, b) => (a.distance || 999) - (b.distance || 999));

    // Limit to requested number
    profiles = profiles.slice(0, limit);

    return profiles;
  } catch (error) {
    console.error("Get profiles error:", error);
    throw error;
  }
};

/**
 * Check if swipe creates a match
 * @param {string} userId - User who swiped
 * @param {string} targetUserId - User who was swiped on
 * @returns {boolean} True if match, false otherwise
 */
const checkMatch = async (userId, targetUserId) => {
  try {
    // Check if target user has already liked current user
    const existingSwipe = await Swipe.findOne({
      userId: targetUserId,
      targetUserId: userId,
      action: { $in: ["like", "superlike"] },
    });

    return !!existingSwipe; // Return true if exists
  } catch (error) {
    console.error("Check match error:", error);
    throw error;
  }
};

/**
 * Calculate age from date of birth
 * @param {Date} dateOfBirth
 * @returns {number} Age
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
 * Calculate distance between two coordinates (in km)
 * @param {array} coords1 - [longitude, latitude]
 * @param {array} coords2 - [longitude, latitude]
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (coords1, coords2) => {
  try {
    const distance = geolib.getDistance(
      { latitude: coords1[1], longitude: coords1[0] },
      { latitude: coords2[1], longitude: coords2[0] }
    );

    // Convert meters to kilometers
    return Math.round(distance / 1000);
  } catch (error) {
    console.error("Calculate distance error:", error);
    return 999; // Return large number if error
  }
};

/**
 * Get users who liked current user
 * @param {string} userId - Current user ID
 * @returns {array} Array of users who liked this user
 */
const getUsersWhoLikedMe = async (userId) => {
  try {
    const swipes = await Swipe.find({
      targetUserId: userId,
      action: { $in: ["like", "superlike"] },
    })
      .populate("userId", "name age gender photos bio occupation location")
      .sort({ createdAt: -1 });

    return swipes.map((swipe) => swipe.userId);
  } catch (error) {
    console.error("Get users who liked me error:", error);
    throw error;
  }
};

module.exports = {
  getProfilesToSwipe,
  checkMatch,
  calculateAge,
  calculateDistance,
  getUsersWhoLikedMe,
};
