const express = require("express");
const router = express.Router();
const {
  getUserById,
  getMyProfile,
  updateMyProfile,
  uploadPhoto,
  deletePhoto,
  setMainPhoto,
  updateLocation,
} = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");
const { upload } = require("../middleware/upload.middleware");

// All routes are protected
router.use(protect);

// Profile routes
router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);
router.get("/:id", getUserById);

// Photo routes
router.post("/me/photos", upload.single("photo"), uploadPhoto);
// router.post("/me/photos", upload.array("photo", 6), uploadPhoto); // Hỗ trợ upload nhiều ảnh cùng lúc
router.delete("/me/photos/:photoId", deletePhoto);
router.put("/me/photos/:photoId/main", setMainPhoto);

// Location route
router.put("/me/location", updateLocation);

module.exports = router;
