const axios = require("axios");
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
    log("red", "   Please run seed-user.js first!");
    process.exit(1);
  }
}

// Get user gender from email
function getUserGender(email) {
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

// Swipe/Like on a user
async function swipeOnUser(fromToken, targetUserId, action = "like") {
  try {
    const response = await axios.post(
      `${API_URL}/discovery/swipe`,
      {
        targetUserId,
        action,
      },
      {
        headers: {
          Authorization: `Bearer ${fromToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message);
  }
}

// Main function to create matches
async function createMatches() {
  log("magenta", "\n" + "=".repeat(70));
  log("magenta", "💕 HEARTSYNC - CREATE MATCHES SCRIPT");
  log("magenta", "=".repeat(70) + "\n");

  log(
    "yellow",
    "ℹ️  NOTE: If users have already swiped, those will be skipped."
  );
  log(
    "yellow",
    "   To reset all swipes/matches, delete data from MongoDB collections:"
  );
  log("yellow", "   - Swipe collection");
  log("yellow", "   - Match collection");
  log("yellow", "   - Conversation collection\n");

  const users = loadUserTokens();

  // Separate users by gender
  const maleUsers = users.filter((u) => getUserGender(u.email) === "male");
  const femaleUsers = users.filter((u) => getUserGender(u.email) === "female");

  log("cyan", `👥 Found ${maleUsers.length} male users`);
  log("cyan", `👥 Found ${femaleUsers.length} female users\n`);

  // Select 3 males and 3 females for matching
  const selectedMales = maleUsers.slice(0, 3);
  const selectedFemales = femaleUsers.slice(0, 3);

  log("yellow", "📋 Selected users for matching:\n");
  log("blue", "Males:");
  selectedMales.forEach((u, i) => log("blue", `  ${i + 1}. ${u.email}`));
  log("blue", "\nFemales:");
  selectedFemales.forEach((u, i) => log("blue", `  ${i + 1}. ${u.email}`));
  log("");

  const results = {
    totalSwipes: 0,
    successfulSwipes: 0,
    matchesCreated: 0,
    failed: [],
  };

  const allMatches = [];

  // Create matches: Each user matches with 3 users of opposite gender
  log(
    "cyan",
    "\n🔄 Starting mutual likes (each user matches with 3 others)...\n"
  );

  // Each male likes all 3 females
  for (let i = 0; i < selectedMales.length; i++) {
    const male = selectedMales[i];
    log("yellow", `\n[Male ${i + 1}/3] ${male.email} likes all females...`);

    for (let j = 0; j < selectedFemales.length; j++) {
      const female = selectedFemales[j];

      try {
        log("blue", `  👉 Liking ${female.email}...`);
        const swipe = await swipeOnUser(male.token, female.userId, "like");
        results.totalSwipes++;
        results.successfulSwipes++;

        if (swipe.data.isMatch) {
          log("magenta", `  💕 IT'S A MATCH with ${female.email}!`);
          results.matchesCreated++;
          allMatches.push({
            user1: { email: male.email, userId: male.userId },
            user2: { email: female.email, userId: female.userId },
          });
        } else {
          log("green", "  ✅ Like recorded");
        }

        await delay(800);
      } catch (error) {
        results.totalSwipes++;

        // Handle "already swiped" error gracefully
        if (error.message.includes("already swiped")) {
          log("yellow", `  ⚠️  Already swiped (skipping)`);
        } else {
          log("red", `  ❌ Error: ${error.message}`);
          results.failed.push({
            pair: `${male.email} → ${female.email}`,
            error: error.message,
          });
        }
      }
    }
  }

  log("cyan", "\n" + "-".repeat(70) + "\n");

  // Each female likes all 3 males
  for (let i = 0; i < selectedFemales.length; i++) {
    const female = selectedFemales[i];
    log("yellow", `\n[Female ${i + 1}/3] ${female.email} likes all males...`);

    for (let j = 0; j < selectedMales.length; j++) {
      const male = selectedMales[j];

      try {
        log("blue", `  👈 Liking ${male.email}...`);
        const swipe = await swipeOnUser(female.token, male.userId, "like");
        results.totalSwipes++;
        results.successfulSwipes++;

        if (swipe.data.isMatch) {
          log("magenta", `  💕 IT'S A MATCH with ${male.email}!`);
          results.matchesCreated++;

          // Check if not already added
          const exists = allMatches.some(
            (m) =>
              (m.user1.userId === female.userId &&
                m.user2.userId === male.userId) ||
              (m.user1.userId === male.userId &&
                m.user2.userId === female.userId)
          );

          if (!exists) {
            allMatches.push({
              user1: { email: female.email, userId: female.userId },
              user2: { email: male.email, userId: male.userId },
            });
          }
        } else {
          log("green", "  ✅ Like recorded");
        }

        await delay(800);
      } catch (error) {
        results.totalSwipes++;

        // Handle "already swiped" error gracefully
        if (error.message.includes("already swiped")) {
          log("yellow", `  ⚠️  Already swiped (skipping)`);
        } else {
          log("red", `  ❌ Error: ${error.message}`);
          results.failed.push({
            pair: `${female.email} → ${male.email}`,
            error: error.message,
          });
        }
      }
    }
  }

  // Summary
  log("cyan", "\n" + "=".repeat(70));
  log("cyan", "📊 MATCHES CREATION SUMMARY");
  log("cyan", "=".repeat(70));
  log(
    "green",
    `✅ Total swipes: ${results.successfulSwipes}/${results.totalSwipes}`
  );
  log("magenta", `💕 Matches created: ${results.matchesCreated}`);
  log("cyan", `👥 Each user now has 3 matches with opposite gender`);

  if (results.failed.length > 0) {
    log("red", `\n❌ Failed swipes (${results.failed.length}):`);
    results.failed.forEach((fail) => {
      log("red", `   - ${fail.pair}: ${fail.error}`);
    });
  }

  log("cyan", "\n📝 All Matches:");
  allMatches.forEach((match, i) => {
    log("cyan", `   ${i + 1}. ${match.user1.email} ↔ ${match.user2.email}`);
  });

  log("cyan", "\n📋 Matches per user:");

  // Count matches per user
  const matchCounts = {};
  allMatches.forEach((match) => {
    matchCounts[match.user1.email] = (matchCounts[match.user1.email] || 0) + 1;
    matchCounts[match.user2.email] = (matchCounts[match.user2.email] || 0) + 1;
  });

  selectedMales.forEach((male) => {
    log("cyan", `   ${male.email}: ${matchCounts[male.email] || 0} matches`);
  });
  selectedFemales.forEach((female) => {
    log(
      "cyan",
      `   ${female.email}: ${matchCounts[female.email] || 0} matches`
    );
  });

  log("cyan", "=".repeat(70) + "\n");

  // Save match info
  const matchInfo = {
    timestamp: new Date().toISOString(),
    totalMatches: allMatches.length,
    matches: allMatches,
    matchesPerUser: matchCounts,
  };

  fs.writeFileSync(
    path.join(__dirname, "match-info.json"),
    JSON.stringify(matchInfo, null, 2)
  );
  log("green", "💾 Match info saved to scripts/match-info.json\n");
}

// Run the script
createMatches()
  .then(() => {
    log("green", "✨ Match creation completed successfully!\n");
    process.exit(0);
  })
  .catch((error) => {
    log("red", `\n❌ Fatal error: ${error.message}\n`);
    process.exit(1);
  });
