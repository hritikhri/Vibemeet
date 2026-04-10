// backend/socket/privateChat.js
const PrivateMessage = require("../models/PrivateMessage.js");
const { createNotification } = require("../controllers/notificationController.js");

const registerPrivateChatHandlers = (io, socket, { onlineUsers }) => {

  // Join Private Chat Room (unchanged)
  socket.on("joinPrivateChat", (otherUserId) => {
    const currentUser = onlineUsers.get(socket.id);
    if (!currentUser?.userId || !otherUserId) return;

    const room = `private_${Math.min(currentUser.userId, otherUserId)}_${Math.max(currentUser.userId, otherUserId)}`;
    socket.join(room);
    console.log(`🔗 Private room joined: ${room} by ${currentUser.userId}`);
  });

  // ====================== SEND TEXT MESSAGE ======================
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
        delivered: false,
      });

      const messageToSend = {
        _id: savedMessage._id,
        from: fromUser.userId,
        to: toUserId,
        text: savedMessage.text,
        createdAt: savedMessage.createdAt,
        isRead: false,
        delivered: false,
        status: "sent",
      };

      const room = `private_${Math.min(fromUser.userId, toUserId)}_${Math.max(fromUser.userId, toUserId)}`;
      io.to(room).emit("newPrivateMessage", messageToSend);

      // Notification for receiver
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

  // ====================== MARK AS DELIVERED (Grey Double Tick) ======================
  socket.on("markMessageAsDelivered", async ({ messageId }) => {
    try {
      const currentUser = onlineUsers.get(socket.id);
      if (!currentUser) return;

      const updated = await PrivateMessage.findOneAndUpdate(
        { _id: messageId, to: currentUser.userId, delivered: false },
        { delivered: true },
        { new: true }
      );

      if (updated) {
        // Notify sender
        io.to(`user_${updated.from}`).emit("messageDelivered", {
          messageId,
          delivered: true
        });
      }
    } catch (err) {
      console.error("Mark as delivered error:", err);
    }
  });

  // ====================== MARK AS READ (Blue Double Tick) ======================
  socket.on("markMessageAsRead", async ({ messageId, fromUserId }) => {
    try {
      const currentUser = onlineUsers.get(socket.id);
      if (!currentUser) return;

      const updated = await PrivateMessage.findOneAndUpdate(
        { _id: messageId, from: fromUserId, to: currentUser.userId, isRead: false },
        { 
          isRead: true,
          readAt: new Date()
        },
        { new: true }
      );

      if (updated) {
        io.to(`user_${fromUserId}`).emit("messageRead", {
          messageId,
          isRead: true,
          readAt: updated.readAt
        });
      }
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  });

  // Typing Indicator (unchanged)
  socket.on("typing", ({ toUserId, isTyping }) => {
    const fromUser = onlineUsers.get(socket.id);
    if (!fromUser || !toUserId) return;

    const room = `private_${Math.min(fromUser.userId, toUserId)}_${Math.max(fromUser.userId, toUserId)}`;
    socket.to(room).emit("typing", { 
      fromUserId: fromUser.userId, 
      isTyping 
    });
  });
};

module.exports = registerPrivateChatHandlers;