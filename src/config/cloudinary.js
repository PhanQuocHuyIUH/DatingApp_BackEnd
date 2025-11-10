const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder name
 * @returns {object} Upload result
 */
const uploadImage = async (filePath, folder = "chilldate/profiles") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: "auto",
      transformation: [
        { width: 800, height: 800, crop: "limit" }, // Max 800x800
        { quality: "auto" }, // Auto quality
        { fetch_format: "auto" }, // Auto format (webp nếu browser support)
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {object} Delete result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete image");
  }
};

/**
 * Delete multiple images
 * @param {array} publicIds - Array of public IDs
 */
const deleteMultipleImages = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    console.error("Cloudinary delete multiple error:", error);
    throw new Error("Failed to delete images");
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  deleteMultipleImages,
};
