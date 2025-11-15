// Socket.IO real-time chat
const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error"));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error("User not found"));
      }

      // Attach user to socket
      socket.userId = user._id.toString();
      socket.user = user;

      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.userId}`);

    // Join user's personal room (for receiving messages)
    socket.join(socket.userId);

    // Update user online status
    User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastActive: new Date(),
    }).exec();

    // Join conversation room
    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
      console.log(
        `User ${socket.userId} joined conversation ${conversationId}`
      );
    });

    // Leave conversation room
    socket.on("leave_conversation", (conversationId) => {
      socket.leave(conversationId);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Typing indicator
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      io.to(receiverId).emit("user_typing", {
        conversationId,
        userId: socket.userId,
        isTyping: true,
      });
    });

    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      io.to(receiverId).emit("user_typing", {
        conversationId,
        userId: socket.userId,
        isTyping: false,
      });
    });

    // Message read receipt
    socket.on("message_read", ({ messageId, conversationId, senderId }) => {
      io.to(senderId).emit("message_read_receipt", {
        messageId,
        conversationId,
        readAt: new Date(),
      });
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.userId}`);

      // Update user online status
      User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastActive: new Date(),
      }).exec();
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};