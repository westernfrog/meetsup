const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const cors = require("cors");
const prisma = require("./lib/prisma");

const app = express();
app.use(cors({ origin: "*" }));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const waitingUsers = new Set();
const activeRooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("findPartner", () => {
    waitingUsers.add(socket.id);

    if (waitingUsers.size >= 2) {
      const users = Array.from(waitingUsers);
      const [user1, user2] = users;

      waitingUsers.delete(user1);
      waitingUsers.delete(user2);

      const roomId = `room_${Date.now()}`;

      activeRooms.set(user1, roomId);
      activeRooms.set(user2, roomId);

      io.to(user1).socketsJoin(roomId);
      io.to(user2).socketsJoin(roomId);

      io.to(user1).emit("partnerFound", { roomId, partnerId: user2 });
      io.to(user2).emit("partnerFound", { roomId, partnerId: user1 });
    }
  });

  socket.on("sendMessage", ({ roomId, message }) => {
    io.to(roomId).emit("receiveMessage", message);
  });

  socket.on("typing", (roomId) => {
    socket.to(roomId).emit("partnerTyping");
  });

  socket.on("leaveRoom", (roomId) => {
    socket.to(roomId).emit("partnerDisconnected");
    socket.leave(roomId);
    activeRooms.delete(socket.id);
  });

  socket.on("disconnect", () => {
    waitingUsers.delete(socket.id);
    const roomId = activeRooms.get(socket.id);
    if (roomId) {
      socket.to(roomId).emit("partnerDisconnected");
      activeRooms.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
