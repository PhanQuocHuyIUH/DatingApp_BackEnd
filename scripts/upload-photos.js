const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const API_URL = "http://localhost:3000/api";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

// Helper: Log with color
const log = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Helper: Delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Load user tokens
function loadUserTokens() {
  try {
    const tokensPath = path.join(__dirname, "user-tokens.json");
    const tokensData = fs.readFileSync(tokensPath, "utf8");
    return JSON.parse(tokensData);
  } catch (error) {
    log("red", "❌ Error loading user-tokens.json");
    log("red", "   Please run seed-users.js first!");
    process.exit(1);
  }
}

// Get user gender from email
function getUserGender(email) {
  // Based on seed-users.js data
  const femaleUsers = [
    "alice.nguyen",
    "carol.le",
    "emily.vo",
    "grace.hoang",
    "iris.lam",
    "kate.do",
    "maria.bui",
    "olivia.phan",
    "rachel.tran",
    "tina.le",
  ];

  const maleUsers = [
    "bob.tran",
    "david.pham",
    "frank.nguyen",
    "henry.dang",
    "jack.truong",
    "leo.ngo",
    "nathan.ly",
    "peter.mai",
    "sam.nguyen",
  ];

  const emailPrefix = email.split("@")[0];

  if (
    femaleUsers.some((prefix) => emailPrefix.includes(prefix.split(".")[0]))
  ) {
    return "female";
  } else if (
    maleUsers.some((prefix) => emailPrefix.includes(prefix.split(".")[0]))
  ) {
    return "male";
  } else {
    return "nonbinary";
  }
}

// Get photo count for gender folder
function getPhotoCount(gender) {
  const folderMap = {
    female: 20,
    male: 18,
    nonbinary: 2,
  };
  return folderMap[gender] || 0;
}

// Upload single photo
async function uploadSinglePhoto(token, imagePath, userEmail) {
  try {
    const form = new FormData();
    form.append("photo", fs.createReadStream(imagePath));

    const response = await axios.post(`${API_URL}/users/me/photos`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message);
  }
}

// Main upload function
async function uploadPhotosForAllUsers() {
  log("cyan", "\n📸 Starting photo upload for all users...\n");

  const users = loadUserTokens();
  const results = {
    totalUsers: users.length,
    successfulUsers: 0,
    totalPhotosUploaded: 0,
    failed: [],
  };

  // Track photo usage per gender
  const photoIndexes = {
    female: 0,
    male: 0,
    nonbinary: 0,
  };

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const userNum = i + 1;

    try {
      log("blue", `\n[${userNum}/${users.length}] Processing: ${user.email}`);

      // Determine gender and get photo paths
      const gender = getUserGender(user.email);
      const maxPhotos = getPhotoCount(gender);

      log("yellow", `  👤 Gender: ${gender}`);

      // Get next 2 photos for this gender
      const photoIndex1 = (photoIndexes[gender] % maxPhotos) + 1;
      const photoIndex2 = ((photoIndexes[gender] + 1) % maxPhotos) + 1;

      const photoPath1 = path.join(
        __dirname,
        "..",
        "img",
        gender,
        `${photoIndex1}.jpg`
      );
      const photoPath2 = path.join(
        __dirname,
        "..",
        "img",
        gender,
        `${photoIndex2}.jpg`
      );

      // Verify photos exist
      if (!fs.existsSync(photoPath1)) {
        throw new Error(`Photo not found: ${photoPath1}`);
      }
      if (!fs.existsSync(photoPath2)) {
        throw new Error(`Photo not found: ${photoPath2}`);
      }

      log(
        "yellow",
        `  📁 Using photos: ${photoIndex1}.jpg, ${photoIndex2}.jpg`
      );

      // Upload photo 1
      log("yellow", "  📤 Uploading photo 1/2...");
      await uploadSinglePhoto(user.token, photoPath1, user.email);
      log("green", "  ✅ Photo 1 uploaded successfully");
      results.totalPhotosUploaded++;

      await delay(1000); // Delay between uploads

      // Upload photo 2
      log("yellow", "  📤 Uploading photo 2/2...");
      await uploadSinglePhoto(user.token, photoPath2, user.email);
      log("green", "  ✅ Photo 2 uploaded successfully");
      results.totalPhotosUploaded++;

      // Update photo index for this gender
      photoIndexes[gender] += 2;

      results.successfulUsers++;
      log("green", `  ✅ Completed for ${user.email} (2/2 photos)`);

      // Delay between users
      await delay(1500);
    } catch (error) {
      log("red", `  ❌ Error: ${error.message}`);
      results.failed.push({
        email: user.email,
        error: error.message,
      });
    }
  }

  // Summary
  log("cyan", "\n" + "=".repeat(70));
  log("cyan", "📊 PHOTO UPLOAD SUMMARY");
  log("cyan", "=".repeat(70));
  log(
    "green",
    `✅ Successfully uploaded photos for: ${results.successfulUsers}/${results.totalUsers} users`
  );
  log(
    "green",
    `📸 Total photos uploaded: ${results.totalPhotosUploaded} photos`
  );
  log(
    "cyan",
    `🔢 Average: ${(
      results.totalPhotosUploaded / results.successfulUsers
    ).toFixed(1)} photos per user`
  );

  if (results.failed.length > 0) {
    log("red", `\n❌ Failed users (${results.failed.length}):`);
    results.failed.forEach((fail) => {
      log("red", `   - ${fail.email}: ${fail.error}`);
    });
  }

  // Photo distribution by gender
  log("cyan", "\n📊 Photo Distribution by Gender:");
  log("cyan", `   Female: Used ${photoIndexes.female} photos (Pool: 20)`);
  log("cyan", `   Male: Used ${photoIndexes.male} photos (Pool: 18)`);
  log("cyan", `   Nonbinary: Used ${photoIndexes.nonbinary} photos (Pool: 2)`);

  log("cyan", "=".repeat(70) + "\n");
}

// Verify folder structure
function verifyFolderStructure() {
  log("yellow", "🔍 Verifying folder structure...\n");

  const baseDir = path.join(__dirname, "..", "img");
  const genders = ["female", "male", "nonbinary"];
  const expectedCounts = {
    female: 20,
    male: 18,
    nonbinary: 2,
  };

  let allValid = true;

  for (const gender of genders) {
    const folderPath = path.join(baseDir, gender);

    if (!fs.existsSync(folderPath)) {
      log("red", `❌ Folder not found: img/${gender}/`);
      allValid = false;
      continue;
    }

    const expectedCount = expectedCounts[gender];
    let foundCount = 0;

    for (let i = 1; i <= expectedCount; i++) {
      const photoPath = path.join(folderPath, `${i}.jpg`);
      if (fs.existsSync(photoPath)) {
        foundCount++;
      }
    }

    if (foundCount === expectedCount) {
      log(
        "green",
        `✅ img/${gender}/: ${foundCount}/${expectedCount} photos found`
      );
    } else {
      log(
        "red",
        `❌ img/${gender}/: Only ${foundCount}/${expectedCount} photos found`
      );
      allValid = false;
    }
  }

  log("");

  if (!allValid) {
    log("red", "❌ Folder structure validation failed!");
    log("yellow", "\nExpected structure:");
    log("yellow", "img/");
    log("yellow", "├── female/");
    log("yellow", "│   ├── 1.jpg");
    log("yellow", "│   ├── 2.jpg");
    log("yellow", "│   └── ... (20 photos)");
    log("yellow", "├── male/");
    log("yellow", "│   ├── 1.jpg");
    log("yellow", "│   ├── 2.jpg");
    log("yellow", "│   └── ... (18 photos)");
    log("yellow", "└── nonbinary/");
    log("yellow", "    ├── 1.jpg");
    log("yellow", "    └── 2.jpg\n");
    process.exit(1);
  }

  log("green", "✅ Folder structure is valid!\n");
}

// Run the script
async function main() {
  log("magenta", "\n" + "=".repeat(70));
  log("magenta", "📸 HEARTSYNC - SEED USER PHOTO UPLOADER");
  log("magenta", "=".repeat(70) + "\n");

  // Step 1: Verify folders
  verifyFolderStructure();

  // Step 2: Upload photos
  await uploadPhotosForAllUsers();

  log("green", "✨ Photo upload completed successfully!\n");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    log("red", `\n❌ Fatal error: ${error.message}\n`);
    process.exit(1);
  });
