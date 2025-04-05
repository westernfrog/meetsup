const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const admin = require("firebase-admin");
const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");
const setupSocket = require("./socket");
require("dotenv").config();

const PORT = process.env.PORT || 4040;
const NODE_ENV = process.env.NODE_ENV;
const FRONTEND_URL = process.env.FRONTEND_URL;

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
  console.log("Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("Firebase Admin SDK initialization error:", error);
  process.exit(1);
}

app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/upload"));

app.get("/", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

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

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

setupSocket(io);

server.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  console.log(`CORS enabled for origin: ${FRONTEND_URL}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  server.close(() => process.exit(1));
});
