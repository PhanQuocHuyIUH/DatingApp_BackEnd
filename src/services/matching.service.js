const User = require("../models/User");
const Swipe = require("../models/Swipe");
const geolib = require("geolib");

/**
 * Get profiles for user to swipe (IMPROVED ALGORITHM)
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

    // Base query - exclude already swiped users
    const baseQuery = {
      _id: { $nin: excludedIds },
    };

    let profiles = [];

    // TIER 1: Same gender preference + nearby location + common interests
    if (profiles.length < limit) {
      const tier1Profiles = await findTier1Profiles(
        currentUser,
        baseQuery,
        limit
      );
      profiles.push(...tier1Profiles);
    }

    // TIER 2: Same gender preference + nearby location (no interest match)
    if (profiles.length < limit) {
      const tier2Profiles = await findTier2Profiles(
        currentUser,
        baseQuery,
        limit - profiles.length
      );
      profiles.push(...tier2Profiles);
    }

    // TIER 3: Same gender preference (ignore location)
    if (profiles.length < limit) {
      const tier3Profiles = await findTier3Profiles(
        currentUser,
        baseQuery,
        limit - profiles.length
      );
      profiles.push(...tier3Profiles);
    }

    // TIER 4: All remaining users (no filters)
    if (profiles.length < limit) {
      const tier4Profiles = await findTier4Profiles(
        currentUser,
        baseQuery,
        limit - profiles.length
      );
      profiles.push(...tier4Profiles);
    }

    // Remove duplicates (by ID)
    profiles = removeDuplicates(profiles);

    // Calculate age and distance for each profile
    profiles = profiles.map((profile) => {
      const profileObj = profile.toObject ? profile.toObject() : profile;
      profileObj.age = calculateAge(profile.dateOfBirth);

      // Calculate distance if both have location
      if (currentUser.location?.coordinates && profile.location?.coordinates) {
        profileObj.distance = calculateDistance(
          currentUser.location.coordinates,
          profile.location.coordinates
        );
      }

      return profileObj;
    });

    // Sort by priority: distance, common interests, recent activity
    profiles = sortProfilesByRelevance(profiles, currentUser);

    // Limit to requested number
    profiles = profiles.slice(0, limit);

    return profiles;
  } catch (error) {
    console.error("Get profiles error:", error);
    throw error;
  }
};

/**
 * TIER 1: Best matches - Same gender + nearby + common interests
 */
const findTier1Profiles = async (currentUser, baseQuery, limit) => {
  try {
    const query = {
      ...baseQuery,
      gender: { $ne: currentUser.gender },
    };

    // If user has interests, find users with common interests
    if (currentUser.interests && currentUser.interests.length > 0) {
      query.interests = { $in: currentUser.interests };
    }

    let profiles = await User.find(query)
      .select(
        "name dateOfBirth gender photos bio occupation education interests languages location lastActive"
      )
      .limit(limit * 2);

    // Filter by distance (50km)
    if (currentUser.location?.coordinates) {
      profiles = profiles.filter((profile) => {
        if (!profile.location?.coordinates) return false;

        const distance = calculateDistance(
          currentUser.location.coordinates,
          profile.location.coordinates
        );

        return distance <= 50;
      });
    }

    return profiles;
  } catch (error) {
    console.error("Tier 1 error:", error);
    return [];
  }
};

/**
 * TIER 2: Good matches - Same gender + nearby (ignore interests)
 */
const findTier2Profiles = async (currentUser, baseQuery, limit) => {
  try {
    const query = {
      ...baseQuery,
      gender: { $ne: currentUser.gender },
    };

    let profiles = await User.find(query)
      .select(
        "name dateOfBirth gender photos bio occupation education interests languages location lastActive"
      )
      .limit(limit * 2);

    // Filter by distance (100km - wider range)
    if (currentUser.location?.coordinates) {
      profiles = profiles.filter((profile) => {
        if (!profile.location?.coordinates) return false;

        const distance = calculateDistance(
          currentUser.location.coordinates,
          profile.location.coordinates
        );

        return distance <= 100;
      });
    }

    return profiles;
  } catch (error) {
    console.error("Tier 2 error:", error);
    return [];
  }
};

/**
 * TIER 3: Okay matches - Same gender (ignore location)
 */
const findTier3Profiles = async (currentUser, baseQuery, limit) => {
  try {
    const query = {
      ...baseQuery,
      gender: { $ne: currentUser.gender },
    };

    const profiles = await User.find(query)
      .select(
        "name dateOfBirth gender photos bio occupation education interests languages location lastActive"
      )
      .limit(limit);

    return profiles;
  } catch (error) {
    console.error("Tier 3 error:", error);
    return [];
  }
};

/**
 * TIER 4: All remaining users (no filters - include same gender)
 */
const findTier4Profiles = async (currentUser, baseQuery, limit) => {
  try {
    const profiles = await User.find(baseQuery)
      .select(
        "name dateOfBirth gender photos bio occupation education interests languages location lastActive"
      )
      .limit(limit);

    return profiles;
  } catch (error) {
    console.error("Tier 4 error:", error);
    return [];
  }
};

/**
 * Remove duplicate profiles
 */
const removeDuplicates = (profiles) => {
  const seen = new Set();
  return profiles.filter((profile) => {
    const id = profile._id.toString();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

/**
 * Sort profiles by relevance
 */
const sortProfilesByRelevance = (profiles, currentUser) => {
  return profiles.sort((a, b) => {
    // Priority 1: Distance (closer is better)
    if (a.distance && b.distance) {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
    }

    // Priority 2: Common interests (more is better)
    const aCommonInterests = countCommonInterests(
      currentUser.interests || [],
      a.interests || []
    );
    const bCommonInterests = countCommonInterests(
      currentUser.interests || [],
      b.interests || []
    );

    if (aCommonInterests !== bCommonInterests) {
      return bCommonInterests - aCommonInterests;
    }

    // Priority 3: Recent activity (more recent is better)
    const aActivity = new Date(a.lastActive || 0).getTime();
    const bActivity = new Date(b.lastActive || 0).getTime();
    return bActivity - aActivity;
  });
};

/**
 * Count common interests
 */
const countCommonInterests = (interests1, interests2) => {
  if (!interests1 || !interests2) return 0;
  return interests1.filter((i) => interests2.includes(i)).length;
};

/**
 * Check if swipe creates a match
 */
const checkMatch = async (userId, targetUserId) => {
  try {
    const existingSwipe = await Swipe.findOne({
      userId: targetUserId,
      targetUserId: userId,
      action: { $in: ["like", "superlike"] },
    });

    return !!existingSwipe;
  } catch (error) {
    console.error("Check match error:", error);
    throw error;
  }
};

/**
 * Calculate age from date of birth
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
 */
const calculateDistance = (coords1, coords2) => {
  try {
    // Validate coordinates
    if (
      !coords1 ||
      !coords2 ||
      !Array.isArray(coords1) ||
      !Array.isArray(coords2) ||
      coords1.length !== 2 ||
      coords2.length !== 2
    ) {
      return 999;
    }

    const [lon1, lat1] = coords1;
    const [lon2, lat2] = coords2;

    // Check if coordinates are valid numbers
    if (
      !lon1 ||
      !lat1 ||
      !lon2 ||
      !lat2 ||
      isNaN(lon1) ||
      isNaN(lat1) ||
      isNaN(lon2) ||
      isNaN(lat2)
    ) {
      return 999;
    }

    const distance = geolib.getDistance(
      { latitude: lat1, longitude: lon1 },
      { latitude: lat2, longitude: lon2 }
    );

    return Math.round(distance / 1000);
  } catch (error) {
    console.error("Calculate distance error:", error);
    return 999;
  }
};

/**
 * Get users who liked current user
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
