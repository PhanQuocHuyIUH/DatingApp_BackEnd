const User = require("../models/User");
const { uploadImage, deleteImage } = require("../config/cloudinary");
const { cleanupTempFile } = require("../middleware/upload.middleware");

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile by ID
 * @access  Private
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toPublicJSON(),
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          age: user.age,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          pronouns: user.pronouns,
          photos: user.photos,
          bio: user.bio,
          occupation: user.occupation,
          education: user.education,
          company: user.company,
          interests: user.interests,
          languages: user.languages,
          location: user.location,
          isOnline: user.isOnline,
          lastActive: user.lastActive,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Get my profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private
 */
const updateMyProfile = async (req, res) => {
  try {
    const {
      name,
      bio,
      occupation,
      education,
      company,
      interests,
      languages,
      location,
      pronouns,
    } = req.body;

    // Fields allowed to update
    const updateFields = {};
    if (name) updateFields.name = name;
    if (bio !== undefined) updateFields.bio = bio;
    if (occupation !== undefined) updateFields.occupation = occupation;
    if (education !== undefined) updateFields.education = education;
    if (company !== undefined) updateFields.company = company;
    if (interests) updateFields.interests = interests;
    if (languages) updateFields.languages = languages;
    if (location) updateFields.location = location;
    if (pronouns) updateFields.pronouns = pronouns;

    // Update user
    const user = await User.findByIdAndUpdate(req.user._id, updateFields, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          bio: user.bio,
          occupation: user.occupation,
          education: user.education,
          company: user.company,
          interests: user.interests,
          languages: user.languages,
          location: user.location,
          pronouns: user.pronouns,
        },
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @route   POST /api/users/me/photos
 * @desc    Upload profile photo
 * @access  Private
 */
const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }

    const user = await User.findById(req.user._id);

    // Check max photos (6 photos max)
    if (user.photos.length >= 6) {
      cleanupTempFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Maximum 6 photos allowed",
      });
    }

    // Upload to Cloudinary
    const result = await uploadImage(req.file.path);

    // Delete temp file
    cleanupTempFile(req.file.path);

    // Add photo to user
    const isFirstPhoto = user.photos.length === 0;
    user.photos.push({
      url: result.url,
      publicId: result.publicId,
      isMain: isFirstPhoto, // First photo is main photo
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Photo uploaded successfully",
      data: {
        photo: {
          url: result.url,
          publicId: result.publicId,
          isMain: isFirstPhoto,
        },
      },
    });
  } catch (error) {
    // Cleanup temp file if error
    if (req.file) {
      cleanupTempFile(req.file.path);
    }

    console.error("Upload photo error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload photo",
      error: error.message,
    });
  }
};

// const uploadPhoto = async (req, res) => {
//   try {
//     // ✅ Check if files exist (array)
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Please upload at least one image",
//       });
//     }

//     const user = await User.findById(req.user._id);

//     // Check max photos
//     const totalPhotos = user.photos.length + req.files.length;
//     if (totalPhotos > 6) {
//       // Cleanup temp files
//       req.files.forEach((file) => cleanupTempFile(file.path));

//       return res.status(400).json({
//         success: false,
//         message: `Maximum 6 photos allowed. You have ${user.photos.length} photos, trying to add ${req.files.length} more`,
//       });
//     }

//     // Upload all files to Cloudinary
//     const uploadPromises = req.files.map((file) => uploadImage(file.path));
//     const uploadResults = await Promise.all(uploadPromises);

//     // Cleanup temp files
//     req.files.forEach((file) => cleanupTempFile(file.path));

//     // Add photos to user
//     const isFirstPhoto = user.photos.length === 0;
//     const newPhotos = uploadResults.map((result, index) => ({
//       url: result.url,
//       publicId: result.publicId,
//       isMain: isFirstPhoto && index === 0, // First photo is main
//     }));

//     user.photos.push(...newPhotos);
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: `${newPhotos.length} photo(s) uploaded successfully`,
//       data: {
//         photos: newPhotos,
//       },
//     });
//   } catch (error) {
//     // Cleanup temp files if error
//     if (req.files) {
//       req.files.forEach((file) => cleanupTempFile(file.path));
//     }

//     console.error("Upload photos error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to upload photos",
//       error: error.message,
//     });
//   }
// };

/**
 * @route   DELETE /api/users/me/photos/:photoId
 * @desc    Delete profile photo
 * @access  Private
 */
const deletePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { photoId } = req.params;

    // Find photo
    const photoIndex = user.photos.findIndex(
      (photo) => photo._id.toString() === photoId
    );

    if (photoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Photo not found",
      });
    }

    const photo = user.photos[photoIndex];

    // Cannot delete if only one photo left
    if (user.photos.length === 1) {
      return res.status(400).json({
        success: false,
        message: "You must have at least one photo",
      });
    }

    // Delete from Cloudinary
    await deleteImage(photo.publicId);

    // Remove from user
    user.photos.splice(photoIndex, 1);

    // If deleted photo was main, set first photo as main
    if (photo.isMain && user.photos.length > 0) {
      user.photos[0].isMain = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Photo deleted successfully",
    });
  } catch (error) {
    console.error("Delete photo error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete photo",
    });
  }
};

/**
 * @route   PUT /api/users/me/photos/:photoId/main
 * @desc    Set photo as main
 * @access  Private
 */
const setMainPhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { photoId } = req.params;

    // Find photo
    const photo = user.photos.find((photo) => photo._id.toString() === photoId);

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Photo not found",
      });
    }

    // Set all photos isMain = false
    user.photos.forEach((p) => (p.isMain = false));

    // Set selected photo as main
    photo.isMain = true;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Main photo updated successfully",
      data: {
        photos: user.photos,
      },
    });
  } catch (error) {
    console.error("Set main photo error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set main photo",
    });
  }
};

/**
 * @route   PUT /api/users/me/location
 * @desc    Update user location
 * @access  Private
 */
const updateLocation = async (req, res) => {
  try {
    const { city, state, country, coordinates } = req.body;

    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid coordinates [longitude, latitude]",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          city,
          state,
          country,
          coordinates,
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: {
        location: user.location,
      },
    });
  } catch (error) {
    console.error("Update location error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update location",
    });
  }
};

module.exports = {
  getUserById,
  getMyProfile,
  updateMyProfile,
  uploadPhoto,
  deletePhoto,
  setMainPhoto,
  updateLocation,
};
