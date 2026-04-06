// backend/socket/privateChat.js
const PrivateMessage = require("../models/PrivateMessage.js");
const { createNotification } = require("../controllers/notificationController.js");

const registerPrivateChatHandlers = (io, socket, { onlineUsers }) => {

  // Join Private Chat Room
  socket.on("joinPrivateChat", (otherUserId) => {
    const currentUser = onlineUsers.get(socket.id);
    if (!currentUser?.userId || !otherUserId) return;

    const room = `private_${Math.min(currentUser.userId, otherUserId)}_${Math.max(currentUser.userId, otherUserId)}`;
    socket.join(room);
    console.log(`🔗 Private room joined: ${room} by ${currentUser.userId}`);
  });

  // Send Private Message
  socket.on("sendPrivateMessage", async ({ toUserId, text }, callback) => {
    try {
      const fromUser = onlineUsers.get(socket.id);
      if (!fromUser || !toUserId || !text?.trim()) {
        return callback?.({ success: false, error: "Missing data" });
      }

      const savedMessage = await PrivateMessage.create({
        from: fromUser.userId,
        to: toUserId,
        text: text.trim(),
        isRead: false,
      });

      const messageToSend = {
        _id: savedMessage._id,
        from: fromUser.userId,
        to: toUserId,
        text: savedMessage.text,
        createdAt: savedMessage.createdAt,
        isRead: false,
        status: "sent",
      };

      const room = `private_${Math.min(fromUser.userId, toUserId)}_${Math.max(fromUser.userId, toUserId)}`;
      io.to(room).emit("newPrivateMessage", messageToSend);

      // Create notification for receiver
      await createNotification(
        toUserId,
        "message",
        fromUser.userId,
        null,
        `You received a new message from ${fromUser.name}`
      );

      callback?.({ success: true, message: messageToSend });
    } catch (err) {
      console.error("Private message error:", err);
      callback?.({ success: false, error: "Failed to send message" });
    }
  });

  // Typing Indicator
  socket.on("typing", ({ toUserId, isTyping }) => {
    const fromUser = onlineUsers.get(socket.id);
    if (!fromUser || !toUserId) return;

    const room = `private_${Math.min(fromUser.userId, toUserId)}_${Math.max(fromUser.userId, toUserId)}`;
    socket.to(room).emit("typing", { 
      fromUserId: fromUser.userId, 
      isTyping 
    });
  });

  // Mark Message as Read
  socket.on("markMessageAsRead", async ({ messageId, fromUserId }) => {
    try {
      const currentUser = onlineUsers.get(socket.id);
      if (!currentUser) return;

      await PrivateMessage.updateOne(
        { _id: messageId, from: fromUserId, to: currentUser.userId },
        { isRead: true }
      );

      io.to(`user_${fromUserId}`).emit("messageRead", {
        messageId,
        readBy: currentUser.userId,
        readAt: new Date(),
      });
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  });
};

module.exports = registerPrivateChatHandlers;