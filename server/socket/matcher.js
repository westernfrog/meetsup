const prisma = require("../lib/prisma-client");
const {
  getWaitingUsers,
  removeWaitingUser,
  addActiveRoom,
  getOnlineUsers,
  getRoomId,
} = require("./manager");

const findMatch = async (socket, io) => {
  const currentEntry = getWaitingUsers().get(socket.id);
  if (!currentEntry) return;

  const currentUser = currentEntry.user;
  const currentPreferences = currentEntry.preferences;

  // First, try to match with other waiting users
  for (const [waitingSocketId, waitingEntry] of getWaitingUsers()) {
    if (waitingSocketId === socket.id) continue; // Skip self

    const waitingUser = waitingEntry.user;
    const waitingPreferences = waitingEntry.preferences;

    // Check if a conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: currentUser.id, user2Id: waitingUser.id },
          { user1Id: waitingUser.id, user2Id: currentUser.id },
        ],
      },
    });

    if (existingConversation) continue;

    // Check if both users match each other's preferences
    if (
      isMatch(waitingUser, currentPreferences) &&
      isMatch(currentUser, waitingPreferences)
    ) {
      await createMatch(
        socket,
        currentUser,
        waitingSocketId,
        waitingUser,
        io,
        "both" // Both users were actively searching
      );
      return;
    }
  }

  // Get online users Map
  const onlineUsers = getOnlineUsers();

  // Try to match with an online user who is not currently searching
  for (const [onlineUserId, onlineUserEntry] of onlineUsers) {
    const onlineUser = onlineUserEntry.user;
    const onlineUserSocketId = onlineUserEntry.socketId;

    // Skip if it's the current user, if the online user is already in a room, or if they are already in the waiting list
    if (
      onlineUser.id === currentUser.id ||
      getRoomId(onlineUserSocketId) ||
      getWaitingUsers().has(onlineUserSocketId)
    ) {
      continue;
    }

    // Check if a conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: currentUser.id, user2Id: onlineUser.id },
          { user1Id: onlineUser.id, user2Id: currentUser.id },
        ],
      },
    });

    if (existingConversation) continue;

    // Check if the online user matches the current user's preferences
    if (isMatch(onlineUser, currentPreferences)) {
      await createMatch(
        socket,
        currentUser,
        onlineUserSocketId,
        onlineUser,
        io,
        "searcherOnly" // Only the searching user should be navigated
      );
      return;
    }
  }

  // If no immediate match, add to waiting list
  socket.emit("waitingForPartner");
};

const isMatch = (user, preferences) => {
  if (!preferences) return true; // No preferences, so it's a match

  const { ageRange, gender } = preferences;

  if (ageRange && (user.age < ageRange[0] || user.age > ageRange[1])) {
    return false;
  }

  if (gender) {
    if (gender === "ANY") {
      // If preference is ANY, it matches any gender
      return true;
    } else if (user.gender === "ANY") {
      // If user's gender is ANY, it matches any preference
      return true;
    } else if (user.gender !== gender) {
      // Otherwise, genders must strictly match
      return false;
    }
  }

  return true;
};

const createMatch = async (
  socket,
  user1,
  partnerSocketId,
  user2,
  io,
  matchType
) => {
  removeWaitingUser(socket.id);
  removeWaitingUser(partnerSocketId);

  try {
    const conversation = await prisma.conversation.create({
      data: {
        user1Id: user1.id,
        user2Id: user2.id,
      },
    });

    const roomId = conversation.id;
    addActiveRoom(socket.id, roomId);
    addActiveRoom(partnerSocketId, roomId);

    const partnerSocket = io.sockets.sockets.get(partnerSocketId);

    socket.join(roomId);
    if (partnerSocket) {
      partnerSocket.join(roomId);
    }

    if (matchType === "both") {
      // Both users were actively searching - navigate both
      socket.emit("partnerFound", { roomId, partner: user2 });
      if (partnerSocket) {
        partnerSocket.emit("partnerFound", { roomId, partner: user1 });
      }
    } else if (matchType === "searcherOnly") {
      // Only the searching user should be navigated
      socket.emit("partnerFound", { roomId, partner: user2 });

      // Send notification to the online user but don't navigate them
      if (partnerSocket) {
        partnerSocket.emit("matchNotification", { roomId, partner: user1 });
      }
    }
  } catch (error) {
    console.error("Error creating match:", error);
    socket.emit("matchFailed", { error: "Failed to create match" });
  }
};

module.exports = { findMatch };
