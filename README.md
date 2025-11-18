# 💕 Dating App Backend

A modern, feature-rich RESTful API for a dating application built with Node.js, Express, and MongoDB. Includes real-time messaging, intelligent matching algorithms, and location-based discovery.

## ✨ Features

- 🔐 **Authentication & Authorization** - JWT-based secure authentication
- 👤 **User Profiles** - Comprehensive profile management with photos and preferences
- 🔍 **Smart Discovery** - Advanced filtering by age, location, interests, and languages
- 💘 **Matching System** - Mutual like-based matching with swipe functionality
- 💬 **Real-time Chat** - Socket.IO powered instant messaging
- 📍 **Location-based** - Distance calculation for nearby users
- 📸 **Photo Upload** - Cloudinary integration for image management
- 🔔 **Push Notifications** - Expo push notifications for matches and messages

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js v5
- **Database:** MongoDB with Mongoose ODM
- **Real-time:** Socket.IO
- **Authentication:** JWT (jsonwebtoken)
- **Cloud Storage:** Cloudinary
- **Validation:** Joi
- **File Upload:** Multer

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)
- npm package manager

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd DatingApp_BackEnd
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database
MONGO_URI=your_mongodb_uri_here

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

```

### 4. Start the server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📁 Project Structure

```
DatingApp_BackEnd/
├── src/
│   ├── server.js              # Application entry point
│   ├── config/                # Configuration files
│   │   ├── database.js        # MongoDB connection
│   │   └── cloudinary.js      # Cloudinary setup
│   ├── controllers/           # Route controllers
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── discovery.controller.js
│   │   ├── match.controller.js
│   │   └── chat.controller.js
│   ├── models/                # Mongoose models
│   │   ├── User.js
│   │   ├── Swipe.js
│   │   ├── Match.js
│   │   ├── Conversation.js
│   │   └── Message.js
│   ├── routes/                # API routes
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── discovery.routes.js
│   │   ├── match.routes.js
│   │   └── chat.routes.js
│   ├── middleware/            # Custom middleware
│   │   ├── auth.middleware.js
│   │   └── upload.middleware.js
│   ├── services/              # Business logic
│   │   ├── matching.service.js
│   │   └── notification.service.js
│   ├── socket/                # Socket.IO setup
│   │   └── index.js
│   └── utils/                 # Utility functions
│       └── jwt.js
├── scripts/                   # Utility scripts
│   ├── seed-user.js           # Seed sample users
│   ├── upload-photos.js       # Upload user photos
│   ├── create-matches.js      # Create sample matches
│   └── reset-matches.js       # Clear match data
├── uploads/                   # Temporary upload directory
├── .env                       # Environment variables
└── package.json              # Dependencies

```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User Profile

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `POST /api/users/photos` - Upload user photos
- `DELETE /api/users/photos/:photoId` - Delete photo

### Discovery

- `GET /api/discovery/profiles` - Get discovery profiles with filters
- `GET /api/discovery/filter` - Advanced profile filtering
- `GET /api/discovery/getLikeSwiped` - Get profiles user has liked
- `POST /api/discovery/swipe` - Swipe on a profile

### Matches

- `GET /api/matches` - Get all matches
- `POST /api/matches/conversation` - Create conversation for match

### Chat

- `POST /api/chats/conversation` - Create conversation
- `GET /api/chats/:conversationId/messages` - Get messages
- `POST /api/chats/:matchId/messages` - Send message

## 🧪 Testing & Development Scripts

### Seed Database

```bash
# Create 20 sample users with profiles
node scripts/seed-user.js

# Upload photos for seeded users
node scripts/upload-photos.js

# Create sample matches between users
node scripts/create-matches.js

# Reset all match data
node scripts/reset-matches.js
```

## 🔧 Configuration

### MongoDB Indexes

The application uses optimized indexes for performance:

- User model: email (unique), location (2dsphere)
- Match model: users (non-unique with validation)
- Conversation model: participants (non-unique with validation)
- Swipe model: swiper + swiped (compound unique)

### File Upload Limits

- Maximum file size: 5MB
- Maximum photos per user: 6

## 🐛 Common Issues & Solution

### Invalid ObjectId Errors

Ensure all IDs passed to endpoints are valid MongoDB ObjectIds (24 character hex strings).
