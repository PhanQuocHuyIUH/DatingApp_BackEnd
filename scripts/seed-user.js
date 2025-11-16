const axios = require("axios");

const API_URL = "http://localhost:3000/api";

// 20 users mẫu với thông tin đa dạng
const sampleUsers = [
  {
    email: "alice.nguyen@gmail.com",
    password: "abc12345",
    name: "Alice Nguyen",
    dateOfBirth: "1996-03-15",
    gender: "female",
    pronouns: "she/her",
    location: {
      city: "Ho Chi Minh City",
      state: "HCMC",
      country: "Vietnam",
      coordinates: [106.6297, 10.8231],
    },
    profile: {
      bio: "Coffee lover ☕ | Travel enthusiast 🌍 | Love trying new restaurants",
      occupation: "Marketing Manager",
      education: "Bachelor's Degree",
      company: "VNG Corporation",
      interests: ["Coffee", "Travel", "Photography", "Food", "Music"],
      languages: ["English", "Vietnamese"],
    },
  },
  {
    email: "bob.tran@gmail.com",
    password: "abc12345",
    name: "Bob Tran",
    dateOfBirth: "1995-07-22",
    gender: "male",
    pronouns: "he/him",
    location: {
      city: "Ho Chi Minh City",
      state: "HCMC",
      country: "Vietnam",
      coordinates: [106.65, 10.83],
    },
    profile: {
      bio: "Software engineer 💻 | Gym enthusiast 💪 | Weekend hiker 🏔️",
      occupation: "Software Engineer",
      education: "Master's Degree",
      company: "FPT Software",
      interests: ["Coding", "Gym", "Hiking", "Gaming", "Tech"],
      languages: ["English", "Vietnamese", "Japanese"],
    },
  },
  {
    email: "carol.le@gmail.com",
    password: "abc12345",
    name: "Carol Le",
    dateOfBirth: "1997-11-08",
    gender: "female",
    pronouns: "she/her",
    location: {
      city: "Hanoi",
      state: "Hanoi",
      country: "Vietnam",
      coordinates: [105.8342, 21.0278],
    },
    profile: {
      bio: "Yoga instructor 🧘‍♀️ | Plant-based lifestyle 🌱 | Animal lover 🐕",
      occupation: "Yoga Instructor",
      education: "Bachelor's Degree",
      company: "Yoga Center Hanoi",
      interests: ["Yoga", "Meditation", "Cooking", "Nature", "Animals"],
      languages: ["English", "Vietnamese"],
    },
  },
  {
    email: "david.pham@gmail.com",
    password: "abc12345",
    name: "David Pham",
    dateOfBirth: "1994-05-30",
    gender: "male",
    pronouns: "he/him",
    location: {
      city: "Da Nang",
      state: "Da Nang",
      country: "Vietnam",
      coordinates: [108.2022, 16.0544],
    },
    profile: {
      bio: "Graphic designer 🎨 | Surfer 🏄‍♂️ | Beach life lover 🌊",
      occupation: "Graphic Designer",
      education: "Bachelor's Degree",
      company: "Freelance",
      interests: ["Design", "Surfing", "Photography", "Art", "Beach"],
      languages: ["English", "Vietnamese"],
    },
  },
  {
    email: "emily.vo@gmail.com",
    password: "abc12345",
    name: "Emily Vo",
    dateOfBirth: "1998-02-14",
    gender: "female",
    pronouns: "she/her",
    location: {
      city: "Ho Chi Minh City",
      state: "HCMC",
      country: "Vietnam",
      coordinates: [106.7, 10.79],
    },
    profile: {
      bio: "Fashion blogger 👗 | Foodie 🍜 | K-pop fan 🎵",
      occupation: "Content Creator",
      education: "Bachelor's Degree",
      company: "Self-employed",
      interests: ["Fashion", "Food", "K-pop", "Shopping", "Social Media"],
      languages: ["English", "Vietnamese", "Korean"],
    },
  },
  {
    email: "frank.nguyen@gmail.com",
    password: "abc12345",
    name: "Frank Nguyen",
    dateOfBirth: "1993-09-12",
    gender: "male",
    pronouns: "he/him",
    location: {
      city: "Ho Chi Minh City",
      state: "HCMC",
      country: "Vietnam",
      coordinates: [106.66, 10.81],
    },
    profile: {
      bio: "Financial analyst 📊 | Chess player ♟️ | Book worm 📚",
      occupation: "Financial Analyst",
      education: "Master's Degree",
      company: "Vietcombank",
      interests: ["Finance", "Chess", "Reading", "Economics", "Strategy Games"],
      languages: ["English", "Vietnamese", "Mandarin"],
    },
  },
  {
    email: "grace.hoang@gmail.com",
    password: "abc12345",
    name: "Grace Hoang",
    dateOfBirth: "1996-12-25",
    gender: "female",
    pronouns: "she/her",
    location: {
      city: "Hanoi",
      state: "Hanoi",
      country: "Vietnam",
      coordinates: [105.82, 21.02],
    },
    profile: {
      bio: "Teacher 👩‍🏫 | Piano player 🎹 | Cat mom 🐱",
      occupation: "English Teacher",
      education: "Bachelor's Degree",
      company: "International School",
      interests: ["Teaching", "Music", "Cats", "Reading", "Languages"],
      languages: ["English", "Vietnamese", "French"],
    },
  },
  {
    email: "henry.dang@gmail.com",
    password: "abc12345",
    name: "Henry Dang",
    dateOfBirth: "1995-04-18",
    gender: "male",
    pronouns: "he/him",
    location: {
      city: "Ho Chi Minh City",
      state: "HCMC",
      country: "Vietnam",
      coordinates: [106.64, 10.84],
    },
    profile: {
      bio: "Photographer 📷 | Drone pilot 🚁 | Adventure seeker 🗺️",
      occupation: "Photographer",
      education: "Bachelor's Degree",
      company: "Freelance",
      interests: ["Photography", "Drones", "Travel", "Adventure", "Technology"],
      languages: ["English", "Vietnamese"],
    },
  },
  {
    email: "iris.lam@gmail.com",
    password: "abc12345",
    name: "Iris Lam",
    dateOfBirth: "1997-08-05",
    gender: "female",
    pronouns: "she/her",
    location: {
      city: "Can Tho",
      state: "Can Tho",
      country: "Vietnam",
      coordinates: [105.7851, 10.0452],
    },
    profile: {
      bio: "Doctor 👩‍⚕️ | Runner 🏃‍♀️ | Classical music lover 🎻",
      occupation: "Doctor",
      education: "Doctorate",
      company: "Can Tho General Hospital",
      interests: [
        "Medicine",
        "Running",
        "Classical Music",
        "Health",
        "Science",
      ],
      languages: ["English", "Vietnamese"],
    },
  },
  {
    email: "jack.truong@gmail.com",
    password: "abc12345",
    name: "Jack Truong",
    dateOfBirth: "1994-01-20",
    gender: "male",
    pronouns: "he/him",
    location: {
      city: "Ho Chi Minh City",
      state: "HCMC",
      country: "Vietnam",
      coordinates: [106.69, 10.77],
    },
    profile: {
      bio: "Chef 👨‍🍳 | Food blogger 🍱 | Wine enthusiast 🍷",
      occupation: "Chef",
      education: "Culinary School",
      company: "Five Star Restaurant",
      interests: ["Cooking", "Food", "Wine", "Travel", "Dining"],
      languages: ["English", "Vietnamese", "Italian"],
    },
  },
  {
    email: "kate.do@gmail.com",
    password: "abc12345",
    name: "Kate Do",
    dateOfBirth: "1998-06-10",
    gender: "female",
    pronouns: "she/her",
    location: {
      city: "Ho Chi Minh City",
      state: "HCMC",
      country: "Vietnam",
      coordinates: [106.72, 10.8],
    },
    profile: {
      bio: "Dancer 💃 | Fitness coach 🏋️‍♀️ | Smoothie lover 🥤",
      occupation: "Dance Instructor",
      education: "Bachelor's Degree",
      company: "Dance Studio HCMC",
      interests: ["Dancing", "Fitness", "Health", "Music", "Choreography"],
      languages: ["English", "Vietnamese"],
    },
  },
  {
    email: "leo.ngo@gmail.com",
    password: "abc12345",
    name: "Leo Ngo",
    dateOfBirth: "1993-10-15",
    gender: "male",
    pronouns: "he/him",
    location: {
      city: "Hanoi",
      state: "Hanoi",
      country: "Vietnam",
      coordinates: [105.85, 21.01],
    },
    profile: {
      bio: "Architect 🏗️ | Cyclist 🚴‍♂️ | Coffee connoisseur ☕",
      occupation: "Architect",
      education: "Master's Degree",
      company: "Design Studio",
      interests: ["Architecture", "Design", "Cycling", "Coffee", "Art"],
      languages: ["English", "Vietnamese", "German"],
    },
  },
  {
    email: "maria.bui@gmail.com",
    password: "abc12345",
    name: "Maria Bui",
    dateOfBirth: "1996-09-28",
    gender: "female",
    pronouns: "she/her",
    location: {
      city: "Nha Trang",
      state: "Khanh Hoa",
      country: "Vietnam",
      coordinates: [109.1967, 12.2388],
    },
    profile: {
      bio: "Marine biologist 🐠 | Scuba diver 🤿 | Ocean advocate 🌊",
      occupation: "Marine Biologist",
      education: "Master's Degree",
      company: "Ocean Research Center",
      interests: [
        "Marine Biology",
        "Diving",
        "Conservation",
        "Ocean",
        "Science",
      ],
      languages: ["English", "Vietnamese"],
    },
  },
  {
    email: "nathan.ly@gmail.com",
    password: "abc12345",
    name: "Nathan Ly",
    dateOfBirth: "1995-03-07",
    gender: "male",
    pronouns: "he/him",
    location: {
      city: "Ho Chi Minh City",
      state: "HCMC",
      country: "Vietnam",
      coordinates: [106.68, 10.82],
    },
    profile: {
      bio: "Startup founder 🚀 | Tech enthusiast 💻 | Public speaker 🎤",
      occupation: "Entrepreneur",
      education: "Master's Degree",
      company: "Tech Startup",
      interests: [
        "Startups",
        "Technology",
        "Innovation",
        "Business",
        "Speaking",
      ],
      languages: ["English", "Vietnamese", "Mandarin"],
    },
  },
  {
    email: "olivia.phan@gmail.com",
    password: "abc12345",
    name: "Olivia Phan",
    dateOfBirth: "1997-07-19",
    gender: "female",
    pronouns: "she/her",
    location: {
      city: "Ho Chi Minh City",
      state: "HCMC",
      country: "Vietnam",
      coordinates: [106.71, 10.78],
    },
    profile: {
      bio: "Interior designer 🛋️ | Plant parent 🪴 | Vintage collector 🎨",
      occupation: "Interior Designer",
      education: "Bachelor's Degree",
      company: "Design Studio",
      interests: ["Interior Design", "Plants", "Vintage", "Art", "Decor"],
      languages: ["English", "Vietnamese"],
    },
  },
  {
    email: "peter.mai@gmail.com",
    password: "abc12345",
    name: "Peter Mai",
    dateOfBirth: "1994-11-22",
    gender: "male",
    pronouns: "he/him",
    location: {
      city: "Da Lat",
      state: "Lam Dong",
      country: "Vietnam",
      coordinates: [108.4378, 11.9404],
    },
    profile: {
      bio: "Coffee farmer ☕ | Nature lover 🌲 | Mountain biker 🚵‍♂️",
      occupation: "Coffee Farmer",
      education: "Bachelor's Degree",
      company: "Own Farm",
      interests: ["Coffee", "Farming", "Nature", "Biking", "Outdoors"],
      languages: ["English", "Vietnamese"],
    },
  },
  {
    email: "quinn.vu@gmail.com",
    password: "abc12345",
    name: "Quinn Vu",
    dateOfBirth: "1996-04-14",
    gender: "nonbinary",
    pronouns: "they/them",
    location: {
      city: "Ho Chi Minh City",
      state: "HCMC",
      country: "Vietnam",
      coordinates: [106.67, 10.79],
    },
    profile: {
      bio: "Artist 🎨 | LGBTQ+ advocate 🏳️‍🌈 | Poetry writer ✍️",
      occupation: "Visual Artist",
      education: "Bachelor's Degree",
      company: "Freelance",
      interests: ["Art", "Poetry", "LGBTQ+", "Culture", "Expression"],
      languages: ["English", "Vietnamese"],
    },
  },
  {
    email: "rachel.tran@gmail.com",
    password: "abc12345",
    name: "Rachel Tran",
    dateOfBirth: "1995-12-03",
    gender: "female",
    pronouns: "she/her",
    location: {
      city: "Hanoi",
      state: "Hanoi",
      country: "Vietnam",
      coordinates: [105.84, 21.03],
    },
    profile: {
      bio: "Journalist 📰 | Podcast host 🎙️ | Storyteller 📖",
      occupation: "Journalist",
      education: "Master's Degree",
      company: "VTV News",
      interests: ["Journalism", "Writing", "Podcasts", "News", "Stories"],
      languages: ["English", "Vietnamese", "Spanish"],
    },
  },
  {
    email: "sam.nguyen@gmail.com",
    password: "abc12345",
    name: "Sam Nguyen",
    dateOfBirth: "1993-08-26",
    gender: "male",
    pronouns: "he/him",
    location: {
      city: "Ho Chi Minh City",
      state: "HCMC",
      country: "Vietnam",
      coordinates: [106.65, 10.81],
    },
    profile: {
      bio: "Musician 🎸 | Music producer 🎵 | Vinyl collector 💿",
      occupation: "Musician",
      education: "Music School",
      company: "Independent",
      interests: ["Music", "Guitar", "Production", "Vinyl", "Concerts"],
      languages: ["English", "Vietnamese"],
    },
  },
  {
    email: "tina.le@gmail.com",
    password: "abc12345",
    name: "Tina Le",
    dateOfBirth: "1998-05-09",
    gender: "female",
    pronouns: "she/her",
    location: {
      city: "Ho Chi Minh City",
      state: "HCMC",
      country: "Vietnam",
      coordinates: [106.7, 10.83],
    },
    profile: {
      bio: "E-commerce specialist 🛒 | Beauty enthusiast 💄 | Dog lover 🐕",
      occupation: "E-commerce Manager",
      education: "Bachelor's Degree",
      company: "Shopee Vietnam",
      interests: ["E-commerce", "Beauty", "Fashion", "Dogs", "Online Shopping"],
      languages: ["English", "Vietnamese", "Thai"],
    },
  },
];

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Helper: Delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Log with color
const log = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Main seeding function
async function seedUsers() {
  log("cyan", "\n🌱 Starting user seeding...\n");

  const results = {
    registered: 0,
    updated: 0,
    failed: 0,
    tokens: [],
  };

  for (let i = 0; i < sampleUsers.length; i++) {
    const user = sampleUsers[i];

    try {
      log("blue", `\n[${i + 1}/20] Processing: ${user.name} (${user.email})`);

      // STEP 1: Register user
      log("yellow", "  📝 Registering...");
      const registerResponse = await axios.post(`${API_URL}/auth/register`, {
        email: user.email,
        password: user.password,
        name: user.name,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        location: user.location,
      });

      const token = registerResponse.data.data.token;
      const userId = registerResponse.data.data.user.id;

      results.registered++;
      results.tokens.push({ email: user.email, token, userId });

      log("green", `  ✅ Registered successfully (ID: ${userId})`);

      // Small delay
      await delay(500);

      // STEP 2: Update profile
      log("yellow", "  ✏️  Updating profile...");
      await axios.put(
        `${API_URL}/users/me`,
        {
          ...user.profile,
          pronouns: user.pronouns,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      results.updated++;
      log("green", "  ✅ Profile updated successfully");

      // Delay between users
      await delay(1000);
    } catch (error) {
      results.failed++;
      log(
        "red",
        `  ❌ Error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  // Summary
  log("cyan", "\n" + "=".repeat(60));
  log("cyan", "📊 SEEDING SUMMARY");
  log("cyan", "=".repeat(60));
  log("green", `✅ Successfully registered: ${results.registered}/20 users`);
  log("green", `✅ Successfully updated: ${results.updated}/20 profiles`);
  if (results.failed > 0) {
    log("red", `❌ Failed: ${results.failed} users`);
  }
  log(
    "cyan",
    `📝 Total API calls: ${results.registered + results.updated} requests`
  );
  log("cyan", "=".repeat(60) + "\n");

  // Save tokens to file for testing
  const fs = require("fs");
  fs.writeFileSync(
    "scripts/user-tokens.json",
    JSON.stringify(results.tokens, null, 2)
  );
  log("green", "💾 User tokens saved to scripts/user-tokens.json\n");

  // Display login info
  log("yellow", "🔐 LOGIN CREDENTIALS FOR ALL USERS:");
  log("yellow", "   Email: [any user above]@gmail.com");
  log("yellow", "   Password: abc12345\n");
}

// Run the script
seedUsers()
  .then(() => {
    log("green", "✨ Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    log("red", `\n❌ Seeding failed: ${error.message}`);
    process.exit(1);
  });
