const admin = require("firebase-admin");
const prisma = require("./lib/prisma-client");

const waitingUsers = new Map();
const activeRooms = new Map();
const typingUsers = new Map();
const onlineUsers = new Map();

function setupSocket(io) {
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
    onlineUsers.set(socket.user.id, socket.id);

    io.emit("user:online", {
      userId: socket.user.id,
      username: socket.user.name,
    });

    socket.on("findPartner", async (data = {}) => {
      const preferences = data.preferences || null;
      const isInstantMatch = !preferences;

      waitingUsers.set(socket.id, {
        user: socket.user,
        preferences,
        isInstantMatch,
      });

      await findMatch(socket, io);
    });

    socket.on("join", (roomId) => {
      socket.join(roomId);
      activeRooms.set(socket.id, roomId);
    });

    socket.on("typing:start", () => {
      const roomId = activeRooms.get(socket.id);
      if (!roomId) return;

      if (!typingUsers.has(roomId)) {
        typingUsers.set(roomId, new Set());
      }
      typingUsers.get(roomId).add(socket.user.id);

      socket.to(roomId).emit("user:typing", {
        userId: socket.user.id,
        username: socket.user.name,
      });
    });

    socket.on("typing:stop", () => {
      const roomId = activeRooms.get(socket.id);
      if (!roomId) return;

      if (typingUsers.has(roomId)) {
        typingUsers.get(roomId).delete(socket.user.id);

        if (typingUsers.get(roomId).size === 0) {
          typingUsers.delete(roomId);
        }
      }

      socket.to(roomId).emit("user:stoppedTyping", {
        userId: socket.user.id,
        username: socket.user.name,
      });
    });

    socket.on("message:send", async ({ roomId, content, type, imageId }) => {
      const senderId = socket.user.id;

      try {
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

        const message = await prisma.message.create({
          data: {
            conversationId: roomId,
            senderId,
            content,
            type: type,
            imageId: imageId || null,
          },
        });

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

        io.to(roomId).emit("message:receive", {
          ...message,
          senderId,
        });
      } catch (err) {
        socket.emit("error", "Failed to send message");
      }
    });

    socket.on("user:setStatus", (status) => {
      if (status === "offline") {
        if (onlineUsers.has(socket.user.id)) {
          onlineUsers.delete(socket.user.id);

          io.emit("user:offline", {
            userId: socket.user.id,
            username: socket.user.name,
          });
        }
      } else if (status === "online") {
        onlineUsers.set(socket.user.id, socket.id);

        io.emit("user:online", {
          userId: socket.user.id,
          username: socket.user.name,
        });
      }
    });

    socket.on("getOnlineStatus", (userIds, callback) => {
      const statusMap = {};
      userIds.forEach((userId) => {
        statusMap[userId] = onlineUsers.has(userId);
      });
      callback(statusMap);
    });

    socket.on("getAllOnlineUsers", (callback) => {
      callback(Array.from(onlineUsers.keys()));
    });

    socket.on("disconnect", () => {
      waitingUsers.delete(socket.id);

      const roomId = activeRooms.get(socket.id);
      if (roomId && typingUsers.has(roomId)) {
        typingUsers.get(roomId).delete(socket.user.id);
        if (typingUsers.get(roomId).size === 0) {
          typingUsers.delete(roomId);
        }

        socket.to(roomId).emit("user:stoppedTyping", {
          userId: socket.user.id,
          username: socket.user.name,
        });
      }

      if (roomId) {
        socket.to(roomId).emit("partnerDisconnected", {
          userId: socket.user.id,
          username: socket.user.name,
        });
      }

      activeRooms.delete(socket.id);

      if (onlineUsers.get(socket.user.id) === socket.id) {
        onlineUsers.delete(socket.user.id);
        io.emit("user:offline", {
          userId: socket.user.id,
          username: socket.user.name,
        });
      }
    });

    socket.on("cancelFindPartner", () => {
      waitingUsers.delete(socket.id);
      socket.emit("findPartnerCanceled");
    });
  });
}

async function findMatch(socket, io) {
  const currentEntry = waitingUsers.get(socket.id);
  if (!currentEntry) return;

  const currentUser = currentEntry.user;
  const currentPreferences = currentEntry.preferences;
  const isInstantMatch = currentEntry.isInstantMatch;

  if (isInstantMatch) {
    for (const [waitingSocketId, waitingEntry] of waitingUsers.entries()) {
      if (waitingSocketId !== socket.id) {
        createMatch(
          socket.id,
          currentUser,
          waitingSocketId,
          waitingEntry.user,
          io,
          false
        );
        return;
      }
    }

    if (onlineUsers.size > 1) {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (userId === currentUser.id) continue;

        if (activeRooms.has(socketId)) continue;

        try {
          const matchUser = await prisma.user.findUnique({
            where: { id: userId },
          });

          if (matchUser) {
            createMatch(socket.id, currentUser, socketId, matchUser, io, false);
            return;
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          continue;
        }
      }
    }

    try {
      const randomUser = await prisma.user.findFirst({
        where: {
          id: { not: currentUser.id },
        },
        orderBy: {
          lastActiveAt: "desc",
        },
      });

      if (randomUser) {
        const existingConversation = await findExistingConversation(
          currentUser.id,
          randomUser.id
        );

        let roomId;
        if (existingConversation) {
          roomId = existingConversation.id;
        } else {
          const conversation = await prisma.conversation.create({
            data: {
              user1Id: currentUser.id,
              user2Id: randomUser.id,
              type: "INSTANT",
            },
          });
          roomId = conversation.id;
        }

        activeRooms.set(socket.id, roomId);

        socket.join(roomId);

        io.to(socket.id).emit("partnerFound", { roomId, partner: randomUser });

        waitingUsers.delete(socket.id);
        return;
      }
    } catch (err) {
      console.error("Error finding random user:", err);
    }
  } else {
    for (const [waitingSocketId, waitingEntry] of waitingUsers.entries()) {
      if (waitingSocketId === socket.id) continue;

      const waitingUser = waitingEntry.user;
      const waitingPreferences = waitingEntry.preferences;

      if (
        waitingPreferences &&
        !isUserMatchingPreferences(currentUser, waitingPreferences)
      ) {
        continue;
      }

      if (
        currentPreferences &&
        !isUserMatchingPreferences(waitingUser, currentPreferences)
      ) {
        continue;
      }

      createMatch(
        socket.id,
        currentUser,
        waitingSocketId,
        waitingUser,
        io,
        true
      );
      return;
    }
  }

  socket.emit("waitingForPartner");
}

async function findExistingConversation(user1Id, user2Id) {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: user1Id, user2Id: user2Id },
          { user1Id: user2Id, user2Id: user1Id },
        ],
      },
    });

    return conversation;
  } catch (err) {
    console.error("Error finding existing conversation:", err);
    return null;
  }
}

function isUserMatchingPreferences(user, preferences) {
  if (preferences.ageMin !== undefined && preferences.ageMax !== undefined) {
    if (user.age < preferences.ageMin || user.age > preferences.ageMax) {
      return false;
    }
  }

  if (preferences.gender && preferences.gender !== "any") {
    const preferredGender =
      preferences.gender === "Mars"
        ? "MALE"
        : preferences.gender === "Venus"
        ? "FEMALE"
        : null;

    if (preferredGender && user.gender !== preferredGender) {
      return false;
    }
  }

  return true;
}

async function createMatch(
  socketId1,
  user1,
  socketId2,
  user2,
  io,
  isFocused = false
) {
  waitingUsers.delete(socketId1);
  waitingUsers.delete(socketId2);

  try {
    const existingConversation = await findExistingConversation(
      user1.id,
      user2.id
    );

    let roomId;
    if (existingConversation) {
      roomId = existingConversation.id;
    } else {
      const conversation = await prisma.conversation.create({
        data: {
          user1Id: user1.id,
          user2Id: user2.id,
          type: isFocused ? "FOCUSED" : "INSTANT",
        },
      });
      roomId = conversation.id;
    }

    activeRooms.set(socketId1, roomId);
    activeRooms.set(socketId2, roomId);

    const socket1 = io.sockets.sockets.get(socketId1);
    const socket2 = io.sockets.sockets.get(socketId2);

    if (socket1) socket1.join(roomId);
    if (socket2) socket2.join(roomId);

    io.to(socketId1).emit("partnerFound", { roomId, partner: user2 });

    if (socket2) {
      if (!isFocused) {
        io.to(socketId2).emit("matchedWith", {
          roomId,
          partner: user1,
          isInstant: true,
        });
      } else {
        io.to(socketId2).emit("partnerFound", { roomId, partner: user1 });
      }
    }
  } catch (err) {
    console.error("Error creating match:", err);

    waitingUsers.set(socketId1, {
      user: user1,
      preferences: isFocused ? {} : null,
      isInstantMatch: !isFocused,
    });

    if (io.sockets.sockets.get(socketId2)) {
      waitingUsers.set(socketId2, {
        user: user2,
        preferences: isFocused ? {} : null,
        isInstantMatch: !isFocused,
      });
    }

    io.to(socketId1).emit("matchFailed", {
      reason: "Failed to create conversation",
    });

    if (io.sockets.sockets.get(socketId2)) {
      io.to(socketId2).emit("matchFailed", {
        reason: "Failed to create conversation",
      });
    }
  }
}

module.exports = setupSocket;
