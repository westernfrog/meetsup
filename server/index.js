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
const logger = require("./utils/logger");
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

try {
  const serviceAccountPath =
    process.env.FIREBASE_CONFIG_PATH ||
    path.resolve(__dirname, "./firebase.json");

  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
  });
  logger.info("Firebase Admin initialized");
} catch (error) {
  logger.error("Firebase initialization error:", error);
  process.exit(1);
}

// API Routes
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/upload"));

app.use("/api", require("./routes/conversations"));

app.get("/", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    status: "error",
    message: NODE_ENV === "production" ? "Internal server error" : err.message,
    stack: NODE_ENV === "production" ? null : err.stack,
  });
});

app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

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

async function startServer() {
  try {
    logger.info(
      "Connecting to Redis at:",
      REDIS_URL ? "Upstash Redis URL provided" : "No Redis URL found"
    );

    if (!REDIS_URL) {
      throw new Error("REDIS_URL environment variable is not set");
    }

    const pubClient = new Redis(REDIS_URL);
    const subClient = new Redis(REDIS_URL);

    pubClient.on("error", (err) => {
      logger.error("Redis Publisher Error:", err);
    });

    subClient.on("error", (err) => {
      logger.error("Redis Subscriber Error:", err);
    });

    await Promise.all([
      new Promise((resolve) => pubClient.once("ready", resolve)),
      new Promise((resolve) => subClient.once("ready", resolve)),
    ]);

    logger.info("Redis connections established");

    io.adapter(createAdapter(pubClient, subClient));
    setupSocket(io);

    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
      logger.info(`🌍 CORS Origin: ${FRONTEND_URL}`);
    });

    const cleanup = async () => {
      logger.info("Shutting down gracefully...");
      await Promise.all([
        pubClient
          .quit()
          .catch((err) =>
            logger.error("Error closing Redis pub client:", err)
          ),
        subClient
          .quit()
          .catch((err) =>
            logger.error("Error closing Redis sub client:", err)
          ),
      ]);
      server.close(() => process.exit(0));
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  } catch (err) {
    logger.error("Redis connection failed:", err);
    process.exit(1);
  }
}

startServer();

// process.on("unhandledRejection", (err) => {
//   logger.error("Unhandled Promise Rejection:", err);
//   server.close(() => process.exit(1));
// });
