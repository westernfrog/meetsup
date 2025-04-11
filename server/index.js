const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const admin = require("firebase-admin");
const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const Redis = require("ioredis");
const setupSocket = require("./socket");
require("dotenv").config();

const PORT = process.env.PORT || 4040;
const NODE_ENV = process.env.NODE_ENV;
const FRONTEND_URL = process.env.FRONTEND_URL;
const REDIS_URL = process.env.REDIS_URL;

const app = express();

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Firebase Admin Initialization
try {
  const serviceAccountPath =
    process.env.FIREBASE_CONFIG_PATH ||
    path.resolve(__dirname, "./firebase.json");

  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
  });
  console.log("✅ Firebase Admin initialized");
} catch (error) {
  console.error("❌ Firebase initialization error:", error);
  process.exit(1);
}

// API Routes
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/upload"));
app.use("/api", require("./routes/conversation"));

// Test Route
app.get("/", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: NODE_ENV === "production" ? "Internal server error" : err.message,
    stack: NODE_ENV === "production" ? null : err.stack,
  });
});

app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

// HTTP & Socket.IO Server
const server = createServer(app);

const io = new Server(server, {
  pingInterval: 10000,
  pingTimeout: 30000,
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Connect to Redis and start the server
async function startServer() {
  try {
    console.log(
      "Connecting to Redis at:",
      REDIS_URL ? "Upstash Redis URL provided" : "No Redis URL found"
    );

    // Validate Redis URL is present
    if (!REDIS_URL) {
      throw new Error("REDIS_URL environment variable is not set");
    }

    // Create Redis clients with explicit connection URL parsing
    const pubClient = new Redis(REDIS_URL);
    const subClient = new Redis(REDIS_URL);

    // Set up event handlers for troubleshooting
    pubClient.on("error", (err) => {
      console.error("Redis Publisher Error:", err);
    });

    subClient.on("error", (err) => {
      console.error("Redis Subscriber Error:", err);
    });

    // Wait for both clients to be ready
    await Promise.all([
      new Promise((resolve) => pubClient.once("ready", resolve)),
      new Promise((resolve) => subClient.once("ready", resolve)),
    ]);

    console.log("✅ Redis connections established");

    // Set up Socket.IO with Redis adapter
    io.adapter(createAdapter(pubClient, subClient));
    setupSocket(io);

    // Start the HTTP server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
      console.log(`🌍 CORS Origin: ${FRONTEND_URL}`);
    });

    // Cleanup on shutdown
    const cleanup = async () => {
      console.log("Shutting down gracefully...");
      await Promise.all([
        pubClient
          .quit()
          .catch((err) =>
            console.error("Error closing Redis pub client:", err)
          ),
        subClient
          .quit()
          .catch((err) =>
            console.error("Error closing Redis sub client:", err)
          ),
      ]);
      server.close(() => process.exit(0));
    };

    // Handle termination signals
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  } catch (err) {
    console.error("❌ Redis connection failed:", err);
    process.exit(1);
  }
}

// Start the server
startServer();

// Catch unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  server.close(() => process.exit(1));
});
