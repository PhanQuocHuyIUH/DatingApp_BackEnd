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

    // Special handling for nonbinary users
    if (currentUser.gender === "nonbinary") {
      // TIER 0: Other nonbinary users only (highest priority)
      if (profiles.length < limit) {
        const tier0Profiles = await findNonbinaryProfiles(
          currentUser,
          baseQuery,
          limit
        );
        tier0Profiles.forEach((p) => {
          p._tierLevel = 0;
          p._isNonbinary = true;
        });
        profiles.push(...tier0Profiles);
      }

      // TIER 1: Nearby users (male/female within distance)
      if (profiles.length < limit) {
        const tier1Profiles = await findNearbyUsersForNonbinary(
          currentUser,
          baseQuery,
          limit - profiles.length
        );
        tier1Profiles.forEach((p) => (p._tierLevel = 1));
        profiles.push(...tier1Profiles);
      }

      // TIER 2: All remaining users (male/female, any location)
      if (profiles.length < limit) {
        const tier2Profiles = await findRemainingUsersForNonbinary(
          currentUser,
          baseQuery,
          limit - profiles.length
        );
        tier2Profiles.forEach((p) => (p._tierLevel = 2));
        profiles.push(...tier2Profiles);
      }
    } else {
      // Standard flow for male/female users

      // TIER 1: Opposite gender (male/female only) + nearby location + common interests
      if (profiles.length < limit) {
        const tier1Profiles = await findTier1Profiles(
          currentUser,
          baseQuery,
          limit
        );
        tier1Profiles.forEach((p) => (p._tierLevel = 1));
        profiles.push(...tier1Profiles);
      }

      // TIER 2: Opposite gender (male/female only) + nearby location (no interest match)
      if (profiles.length < limit) {
        const tier2Profiles = await findTier2Profiles(
          currentUser,
          baseQuery,
          limit - profiles.length
        );
        tier2Profiles.forEach((p) => (p._tierLevel = 2));
        profiles.push(...tier2Profiles);
      }

      // TIER 3: Opposite gender (male/female only) (ignore location)
      if (profiles.length < limit) {
        const tier3Profiles = await findTier3Profiles(
          currentUser,
          baseQuery,
          limit - profiles.length
        );
        tier3Profiles.forEach((p) => (p._tierLevel = 3));
        profiles.push(...tier3Profiles);
      }

      // TIER 4: Nonbinary users (lower priority for male/female users)
      if (profiles.length < limit) {
        const tier4Profiles = await findNonbinaryProfiles(
          currentUser,
          baseQuery,
          limit - profiles.length
        );
        tier4Profiles.forEach((p) => (p._tierLevel = 4));
        profiles.push(...tier4Profiles);
      }

      // TIER 5: Same gender (last resort)
      if (profiles.length < limit) {
        const tier5Profiles = await findTier5Profiles(
          currentUser,
          baseQuery,
          limit - profiles.length
        );
        tier5Profiles.forEach((p) => (p._tierLevel = 5));
        profiles.push(...tier5Profiles);
      }
    }

    // Remove duplicates (by ID) - keep the one with lower tier level
    profiles = removeDuplicates(profiles);

    // Calculate age and distance for each profile
    profiles = profiles.map((profile) => {
      const profileObj = profile.toObject ? profile.toObject() : profile;
      profileObj.age = calculateAge(profile.dateOfBirth);

      // Preserve tier level and nonbinary flag
      profileObj._tierLevel = profile._tierLevel;
      profileObj._isNonbinary = profile._isNonbinary || false;

      // Calculate distance if both have location
      if (currentUser.location?.coordinates && profile.location?.coordinates) {
        profileObj.distance = calculateDistance(
          currentUser.location.coordinates,
          profile.location.coordinates
        );
      }

      return profileObj;
    });

    // Sort by tier first, then by relevance within each tier
    profiles = sortProfilesByTierAndRelevance(profiles, currentUser);

    // Remove internal flags before returning
    profiles.forEach((p) => {
      delete p._tierLevel;
      delete p._isNonbinary;
    });

    // Limit to requested number
    profiles = profiles.slice(0, limit);

    return profiles;
  } catch (error) {
    console.error("Get profiles error:", error);
    throw error;
  }
};

/**
 * TIER 0: Find nonbinary profiles (for nonbinary current user)
 */
const findNonbinaryProfiles = async (currentUser, baseQuery, limit) => {
  try {
    const query = {
      ...baseQuery,
      gender: "nonbinary",
    };

    const profiles = await User.find(query)
      .select(
        "name dateOfBirth gender photos bio occupation education interests languages location lastActive"
      )
      .limit(limit * 3);

    return profiles;
  } catch (error) {
    console.error("Tier 0 (Nonbinary) error:", error);
    return [];
  }
};

/**
 * TIER 1: Find nearby users (male/female) for nonbinary current user
 */
const findNearbyUsersForNonbinary = async (currentUser, baseQuery, limit) => {
  try {
    const query = {
      ...baseQuery,
      gender: { $in: ["male", "female"] },
    };

    let profiles = await User.find(query)
      .select(
        "name dateOfBirth gender photos bio occupation education interests languages location lastActive"
      )
      .limit(limit * 3);

    // Filter by distance (100km)
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
    console.error("Find nearby users for nonbinary error:", error);
    return [];
  }
};

/**
 * TIER 2: Find all remaining users (male/female, any location) for nonbinary current user
 */
const findRemainingUsersForNonbinary = async (
  currentUser,
  baseQuery,
  limit
) => {
  try {
    const query = {
      ...baseQuery,
      gender: { $in: ["male", "female"] },
    };

    const profiles = await User.find(query)
      .select(
        "name dateOfBirth gender photos bio occupation education interests languages location lastActive"
      )
      .limit(limit);

    return profiles;
  } catch (error) {
    console.error("Find remaining users for nonbinary error:", error);
    return [];
  }
};

/**
 * TIER 1: Best matches - Opposite gender (male/female only) + nearby + common interests
 */
const findTier1Profiles = async (currentUser, baseQuery, limit) => {
  try {
    const query = {
      ...baseQuery,
      gender: { $nin: [currentUser.gender, "nonbinary"] },
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
 * TIER 2: Good matches - Opposite gender (male/female only) + nearby (ignore interests)
 */
const findTier2Profiles = async (currentUser, baseQuery, limit) => {
  try {
    const query = {
      ...baseQuery,
      gender: { $nin: [currentUser.gender, "nonbinary"] },
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
 * TIER 3: Okay matches - Opposite gender (male/female only) (ignore location)
 */
const findTier3Profiles = async (currentUser, baseQuery, limit) => {
  try {
    const query = {
      ...baseQuery,
      gender: { $nin: [currentUser.gender, "nonbinary"] },
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
 * TIER 5: Same gender users (last resort for male/female users)
 */
const findTier5Profiles = async (currentUser, baseQuery, limit) => {
  try {
    const query = {
      ...baseQuery,
      gender: currentUser.gender,
    };

    const profiles = await User.find(query)
      .select(
        "name dateOfBirth gender photos bio occupation education interests languages location lastActive"
      )
      .limit(limit);

    return profiles;
  } catch (error) {
    console.error("Tier 5 error:", error);
    return [];
  }
};

/**
 * Remove duplicate profiles - keep the one with lower tier level (higher priority)
 */
const removeDuplicates = (profiles) => {
  const seenMap = new Map();

  profiles.forEach((profile) => {
    const id = profile._id.toString();
    const existing = seenMap.get(id);

    // Keep the profile with lower tier level (higher priority)
    if (!existing || profile._tierLevel < existing._tierLevel) {
      seenMap.set(id, profile);
    }
  });

  return Array.from(seenMap.values());
};

/**
 * Sort profiles by tier level first, then by relevance within each tier
 * Special sorting for nonbinary users when current user is nonbinary
 */
const sortProfilesByTierAndRelevance = (profiles, currentUser) => {
  return profiles.sort((a, b) => {
    // Priority 0: Tier level (lower tier = higher priority)
    if (a._tierLevel !== b._tierLevel) {
      return a._tierLevel - b._tierLevel;
    }

    // Special sorting for Tier 0 (Nonbinary profiles when current user is nonbinary)
    if (
      currentUser.gender === "nonbinary" &&
      a._isNonbinary &&
      b._isNonbinary
    ) {
      // For nonbinary tier: 1) Distance, 2) Common interests, 3) Recent activity

      // Priority 1: Distance (closer is better)
      if (a.distance !== undefined && b.distance !== undefined) {
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
      } else if (a.distance !== undefined) {
        return -1;
      } else if (b.distance !== undefined) {
        return 1;
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
    }

    // For nonbinary current user with male/female profiles (tier 1, 2)
    // Sort by distance first, then other criteria
    if (
      currentUser.gender === "nonbinary" &&
      (a._tierLevel === 1 || a._tierLevel === 2)
    ) {
      // Priority 1: Distance (closer is better)
      if (a.distance !== undefined && b.distance !== undefined) {
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
      } else if (a.distance !== undefined) {
        return -1;
      } else if (b.distance !== undefined) {
        return 1;
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
    }

    // Standard sorting for male/female current users (tiers 1-4):

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
