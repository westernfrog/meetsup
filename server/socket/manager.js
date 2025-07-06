const onlineUsers = new Map(); // userId -> { socketId, user }
const waitingUsers = new Map(); // socketId -> { user, preferences }
const activeRooms = new Map(); // socketId -> roomId
const typingUsers = new Map();

const addUserOnline = (userId, socketId, user) => {
  onlineUsers.set(userId, { socketId, user });
};

const removeUserOnline = (userId) => {
  onlineUsers.delete(userId);
};

const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

const getOnlineUsers = () => {
  return onlineUsers; // Return the Map directly so we can iterate over entries
};

const addWaitingUser = (socketId, user, preferences) => {
  waitingUsers.set(socketId, { user, preferences });
};

const removeWaitingUser = (socketId) => {
  waitingUsers.delete(socketId);
};

const getWaitingUsers = () => {
  return waitingUsers;
};

const addActiveRoom = (socketId, roomId) => {
  activeRooms.set(socketId, roomId);
};

const getRoomId = (socketId) => {
  return activeRooms.get(socketId);
};

const removeActiveRoom = (socketId) => {
  activeRooms.delete(socketId);
};

const startTyping = (roomId, userId) => {
  if (!typingUsers.has(roomId)) {
    typingUsers.set(roomId, new Set());
  }
  typingUsers.get(roomId).add(userId);
};

const stopTyping = (roomId, userId) => {
  if (typingUsers.has(roomId)) {
    typingUsers.get(roomId).delete(userId);
    if (typingUsers.get(roomId).size === 0) {
      typingUsers.delete(roomId);
    }
  }
};

const getTypingUsers = (roomId) => {
  return typingUsers.get(roomId) || new Set();
};

module.exports = {
  addUserOnline,
  removeUserOnline,
  isUserOnline,
  getOnlineUsers,
  addWaitingUser,
  removeWaitingUser,
  getWaitingUsers,
  addActiveRoom,
  getRoomId,
  removeActiveRoom,
  startTyping,
  stopTyping,
  getTypingUsers,
};
