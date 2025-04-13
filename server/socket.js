const admin = require("firebase-admin");
const prisma = require("./lib/prisma-client");

// Store user states and active connections
const waitingUsers = new Map();
const activeRooms = new Map();
const typingUsers = new Map();
const onlineUsers = new Map(); // Track online users by their user ID

function setupSocket(io) {
  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No auth token provided"));

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      const user = await prisma.user.findUnique({
        where: { fId: decoded.uid },
      });

      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    // Mark user as online when they connect
    onlineUsers.set(socket.user.id, socket.id);

    // Broadcast user's online status to all connected clients
    io.emit("user:online", {
      userId: socket.user.id,
      username: socket.user.name,
    });

    // Find a chat partner
    socket.on("findPartner", async () => {
      // Add user to waiting pool
      waitingUsers.set(socket.id, socket.user);

      // Match if we have at least 2 users
      if (waitingUsers.size >= 2) {
        // Get first user
        const [id1, user1] = waitingUsers.entries().next().value;
        waitingUsers.delete(id1);

        // Get second user
        const [id2, user2] = waitingUsers.entries().next().value;
        waitingUsers.delete(id2);

        try {
          // Create conversation in database
          const conversation = await prisma.conversation.create({
            data: {
              user1Id: user1.id,
              user2Id: user2.id,
              type: "INSTANT",
            },
          });

          const roomId = conversation.id;

          // Track which room each socket belongs to
          activeRooms.set(id1, roomId);
          activeRooms.set(id2, roomId);

          // Join both sockets to the room
          const socket1 = io.sockets.sockets.get(id1);
          const socket2 = io.sockets.sockets.get(id2);

          if (socket1) socket1.join(roomId);
          if (socket2) socket2.join(roomId);

          // Notify both users
          io.to(id1).emit("partnerFound", { roomId, partner: user2 });
          io.to(id2).emit("partnerFound", { roomId, partner: user1 });
        } catch (err) {
          // Return users to waiting pool
          waitingUsers.set(id1, user1);
          waitingUsers.set(id2, user2);

          // Notify both users of failure
          io.to(id1).emit("matchFailed", {
            reason: "Failed to create conversation",
          });
          io.to(id2).emit("matchFailed", {
            reason: "Failed to create conversation",
          });
        }
      } else {
        socket.emit("waitingForPartner");
      }
    });

    // Join an existing room
    socket.on("join", (roomId) => {
      socket.join(roomId);
      activeRooms.set(socket.id, roomId);
    });

    // Handle typing indicator
    socket.on("typing:start", () => {
      const roomId = activeRooms.get(socket.id);
      if (!roomId) return;

      // Add user to typing map for this room
      if (!typingUsers.has(roomId)) {
        typingUsers.set(roomId, new Set());
      }
      typingUsers.get(roomId).add(socket.user.id);

      // Broadcast to room that this user is typing
      socket.to(roomId).emit("user:typing", {
        userId: socket.user.id,
        username: socket.user.name,
      });
    });

    socket.on("typing:stop", () => {
      const roomId = activeRooms.get(socket.id);
      if (!roomId) return;

      // Remove user from typing map for this room
      if (typingUsers.has(roomId)) {
        typingUsers.get(roomId).delete(socket.user.id);

        // If set is empty, delete the room entry
        if (typingUsers.get(roomId).size === 0) {
          typingUsers.delete(roomId);
        }
      }

      // Broadcast to room that this user stopped typing
      socket.to(roomId).emit("user:stoppedTyping", {
        userId: socket.user.id,
        username: socket.user.name,
      });
    });

    // Send message
    socket.on("message:send", async ({ roomId, content }) => {
      const senderId = socket.user.id;

      try {
        // First verify the conversation exists and user is part of it
        const conversation = await prisma.conversation.findUnique({
          where: { id: roomId },
          select: { id: true, user1Id: true, user2Id: true },
        });

        if (
          !conversation ||
          (conversation.user1Id !== senderId &&
            conversation.user2Id !== senderId)
        ) {
          return socket.emit("error", "Invalid conversation or unauthorized");
        }

        // Create message in database
        const message = await prisma.message.create({
          data: {
            conversationId: roomId,
            senderId,
            content,
            type: "TEXT",
          },
        });

        // Clear typing indicator for this user when they send a message
        if (typingUsers.has(roomId)) {
          typingUsers.get(roomId).delete(senderId);
          if (typingUsers.get(roomId).size === 0) {
            typingUsers.delete(roomId);
          }
        }

        socket.to(roomId).emit("user:stoppedTyping", {
          userId: senderId,
          username: socket.user.name,
        });

        // Broadcast message to room
        io.to(roomId).emit("message:receive", {
          ...message,
          senderId,
        });
      } catch (err) {
        socket.emit("error", "Failed to send message");
      }
    });

    // Allow users to set themselves as "away" or "offline" manually
    socket.on("user:setStatus", (status) => {
      if (status === "offline") {
        // Mark user as offline but don't disconnect
        if (onlineUsers.has(socket.user.id)) {
          onlineUsers.delete(socket.user.id);

          // Broadcast status change to all users
          io.emit("user:offline", {
            userId: socket.user.id,
            username: socket.user.name,
          });
        }
      } else if (status === "online") {
        // Mark user as online
        onlineUsers.set(socket.user.id, socket.id);

        // Broadcast status change to all users
        io.emit("user:online", {
          userId: socket.user.id,
          username: socket.user.name,
        });
      }
    });

    // Method to get online status of specific users
    socket.on("getOnlineStatus", (userIds, callback) => {
      const statusMap = {};
      userIds.forEach((userId) => {
        statusMap[userId] = onlineUsers.has(userId);
      });
      callback(statusMap);
    });

    // Method to get all online users
    socket.on("getAllOnlineUsers", (callback) => {
      callback(Array.from(onlineUsers.keys()));
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      // Remove from waiting users
      waitingUsers.delete(socket.id);

      // Clean up typing indicators
      const roomId = activeRooms.get(socket.id);
      if (roomId && typingUsers.has(roomId)) {
        typingUsers.get(roomId).delete(socket.user.id);
        if (typingUsers.get(roomId).size === 0) {
          typingUsers.delete(roomId);
        }

        // Notify room that user stopped typing
        socket.to(roomId).emit("user:stoppedTyping", {
          userId: socket.user.id,
          username: socket.user.name,
        });
      }

      // Notify partners about disconnection
      if (roomId) {
        socket.to(roomId).emit("partnerDisconnected", {
          userId: socket.user.id,
          username: socket.user.name,
        });
      }

      // Remove from active rooms
      activeRooms.delete(socket.id);

      // Mark user as offline and notify all users
      if (onlineUsers.get(socket.user.id) === socket.id) {
        onlineUsers.delete(socket.user.id);
        io.emit("user:offline", {
          userId: socket.user.id,
          username: socket.user.name,
        });
      }
    });

    // Allow users to cancel finding a partner
    socket.on("cancelFindPartner", () => {
      waitingUsers.delete(socket.id);
      socket.emit("findPartnerCanceled");
    });
  });
}

module.exports = setupSocket;
