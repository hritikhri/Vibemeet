// backend/socket/utils.js
const redis = require('../config/redis');

const onlineUsers = new Map();     // socket.id → { userId, name, avatar }
const userLastSeen = new Map();    // userId → timestamp

// Add user to online list (local + Redis)
const addOnlineUser = async (socketId, userData) => {
  onlineUsers.set(socketId, userData);
  
  try {
    await redis.hSet("online_users", socketId, JSON.stringify(userData));
    await redis.sAdd(`user_sockets:${userData.userId}`, socketId);
  } catch (err) {
    console.error("Redis addOnlineUser error:", err);
  }
};

// Remove user from online list
const removeOnlineUser = async (socketId) => {
  const userInfo = onlineUsers.get(socketId);
  if (userInfo) {
    onlineUsers.delete(socketId);
    userLastSeen.set(userInfo.userId, new Date());   // ← This line was crashing

    try {
      await redis.hDel("online_users", socketId);
      await redis.sRem(`user_sockets:${userInfo.userId}`, socketId);
    } catch (err) {
      console.error("Redis removeOnlineUser error:", err);
    }
  }
};

const sendActivityOnlineUsers = (io, activityId) => {
  const roomName = `activity_${activityId}`;
  const room = io.sockets.adapter.rooms.get(roomName);
  if (!room) return;

  const onlineInActivity = [];

  for (const socketId of room) {
    const userInfo = onlineUsers.get(socketId);
    if (userInfo) {
      onlineInActivity.push({
        userId: userInfo.userId,
        name: userInfo.name,
        avatar: userInfo.avatar,
      });
    }
  }

  io.to(roomName).emit("activityOnlineUsers", {
    activityId,
    users: onlineInActivity,
  });
};

module.exports = {
  onlineUsers,
  userLastSeen,
  addOnlineUser,
  removeOnlineUser,
  sendActivityOnlineUsers,
};