// backend/socket/utils.js
const onlineUsers = new Map();     // socket.id → { userId, name, avatar }
const userLastSeen = new Map();    // userId → timestamp

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
  sendActivityOnlineUsers,
};