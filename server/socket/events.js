const prisma = require("../lib/prisma-client");
const {
  addUserOnline,
  removeUserOnline,
  isUserOnline,
  getOnlineUsers,
  addWaitingUser,
  removeWaitingUser,
  addActiveRoom,
  getRoomId,
  removeActiveRoom,
  startTyping,
  stopTyping,
} = require("./manager");
const { findMatch } = require("./matcher");

const setupSocketEvents = (io) => {
  io.on("connection", (socket) => {
    // Pass the user object to addUserOnline
    addUserOnline(socket.user.id, socket.id, socket.user);
    io.emit("user:online", socket.user.id);

    socket.on("findPartner", (preferences) => {
      addWaitingUser(socket.id, socket.user, preferences);
      findMatch(socket, io);
    });

    socket.on("cancelFindPartner", () => {
      removeWaitingUser(socket.id);
      socket.emit("findPartnerCanceled");
    });

    socket.on("join", async (roomId) => {
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: roomId },
        });

        console.log(conversation);

        if (
          !conversation ||
          (conversation.user1Id !== socket.user.id &&
            conversation.user2Id !== socket.user.id)
        ) {
          return socket.emit("error", "Unauthorized to join this conversation");
        }

        socket.join(roomId);
        addActiveRoom(socket.id, roomId);
        socket.emit("joinSuccess", { roomId });
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", "Failed to join conversation");
      }
    });

    socket.on("message:send", async ({ roomId, content, type, imageId }) => {
      const senderId = socket.user.id;

      try {
        const message = await prisma.message.create({
          data: {
            conversationId: roomId,
            senderId,
            content,
            type,
            imageId,
          },
        });

        io.to(roomId).emit("message:receive", message);
      } catch (err) {
        socket.emit("error", "Failed to send message");
      }
    });

    socket.on("message:seen", async ({ messageId }) => {
      try {
        await prisma.message.update({
          where: { id: messageId },
          data: { seen: true },
        });
      } catch (error) {
        console.error("Error updating message seen status:", error);
      }
    });

    socket.on("typing:start", () => {
      const roomId = getRoomId(socket.id);
      if (roomId) {
        startTyping(roomId, socket.user.id);
        socket.to(roomId).emit("user:typing", { userId: socket.user.id });
      }
    });

    socket.on("typing:stop", () => {
      const roomId = getRoomId(socket.id);
      if (roomId) {
        stopTyping(roomId, socket.user.id);
        socket
          .to(roomId)
          .emit("user:stoppedTyping", { userId: socket.user.id });
      }
    });

    socket.on("getOnlineStatus", (userIds, callback) => {
      const statusMap = {};
      userIds.forEach((userId) => {
        statusMap[userId] = isUserOnline(userId);
      });
      callback(statusMap);
    });

    socket.on("getAllOnlineUsers", (callback) => {
      // Return array of values for this endpoint
      callback(Array.from(getOnlineUsers().values()));
    });

    socket.on("disconnect", () => {
      removeUserOnline(socket.user.id);
      io.emit("user:offline", socket.user.id);

      removeWaitingUser(socket.id);

      const roomId = getRoomId(socket.id);
      if (roomId) {
        socket.to(roomId).emit("partnerDisconnected");
        removeActiveRoom(socket.id);
      }
    });
  });
};

module.exports = setupSocketEvents;
