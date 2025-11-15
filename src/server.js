// Entry point for the Chilling Date API server
const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/database");
const { initializeSocket } = require("./socket");

// Load env
dotenv.config();

// Init app
const app = express();
const server = http.createServer(app); // Create HTTP server

// Initialize Socket.IO
const io = initializeSocket(server);
app.set("io", io); // Make io available in routes

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect DB
connectDB();

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Chilling Date API is running!" });
});

// Auth routes
app.use("/api/auth", require("./routes/auth.routes"));

// User routes
app.use("/api/users", require("./routes/user.routes"));

// Discovery routes
app.use("/api/discovery", require("./routes/discovery.routes"));

// Match routes
app.use("/api/matches", require("./routes/match.routes"));

// Chat routes
app.use("/api/chats", require("./routes/chat.routes"));

// Error handler middleware (optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: err.message,
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
