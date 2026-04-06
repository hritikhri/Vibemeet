// backend/socket/notifications.js

const registerNotificationHandlers = (io, socket, { onlineUsers }) => {
  // You can emit notifications from other handlers or here
  // Example: General notification
  socket.on("sendNotification", ({ toUserId, type, data }) => {
    const sender = onlineUsers.get(socket.id);
    if (!sender) return;

    io.to(`user_${toUserId}`).emit("newNotification", {
      type,
      from: sender.userId,
      data,
      createdAt: new Date(),
    });
  });
};

module.exports = registerNotificationHandlers;