const admin = require("firebase-admin");
const prisma = require("./lib/prisma-client");
const setupSocketEvents = require("./socket/events");

function setupSocket(io) {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("No auth token provided"));
    }

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      const user = await prisma.user.findUnique({
        where: { fId: decoded.uid },
      });

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  setupSocketEvents(io);
}

module.exports = setupSocket;
