const PrivateMessage = require('../models/PrivateMessage.js');
const { createNotification } = require('../controllers/notificationController.js');

exports.setupSocket = (io) => {
  const onlineUsers = new Map(); // socket.id -> userId

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // ==================== AUTHENTICATE ====================
    socket.on('authenticate', (userId) => {
      if (!userId) return;

      onlineUsers.set(socket.id, userId);
      socket.join(`user_${userId}`);

      console.log(`✅ User ${userId} authenticated`);
    });

    // ==================== JOIN PRIVATE CHAT ====================
    socket.on('joinPrivateChat', ({ userId }) => {
      if (!userId) return;

      socket.join(`private_${userId}`);
      console.log(`🔗 Joined room: private_${userId}`);
    });

    // ==================== SEND MESSAGE ====================
    socket.on('sendPrivateMessage', async ({ toUserId, text }) => {
      try {
        const fromUserId = onlineUsers.get(socket.id);

        if (!fromUserId || !toUserId || !text) {
          console.warn("❌ Invalid message data");
          return;
        }

        // 👉 Save message to DB
        const savedMessage = await PrivateMessage.create({
          from: fromUserId,
          to: toUserId,
          text: text.trim(),
        });

        const message = {
          _id: savedMessage._id,
          from: fromUserId,
          to: toUserId,
          text: savedMessage.text,
          createdAt: savedMessage.createdAt,
          isRead: false,
        };

        // 👉 Send message to both users
        io.to(`private_${fromUserId}`)
          .to(`private_${toUserId}`)
          .emit('newPrivateMessage', message);

        console.log("✅ Message sent");

        // 👉 Create notification
        await createNotification(
          toUserId,
          'message',
          fromUserId,
          null,
          'You received a new message'
        );

      } catch (err) {
        console.error("❌ Error sending message:", err);
      }
    });

    // ==================== TYPING ====================
    socket.on('typing', ({ toUserId, isTyping }) => {
      const fromUserId = onlineUsers.get(socket.id);
      if (!fromUserId) return;

      socket.to(`private_${toUserId}`).emit('typing', {
        fromUserId,
        isTyping,
      });
    });

    // ==================== READ RECEIPT ====================
    socket.on('markAsRead', async ({ messageId }) => {
      try {
        const message = await PrivateMessage.findByIdAndUpdate(
          messageId,
          { isRead: true },
          { new: true }
        );

        if (!message) return;

        io.to(`private_${message.from}`).emit('messageRead', {
          messageId: message._id,
        });

      } catch (err) {
        console.error("❌ Read receipt error:", err);
      }
    });

    // ==================== ONLINE STATUS ====================
    socket.on('getOnlineStatus', (targetUserId) => {
      const isOnline = Array.from(onlineUsers.values()).includes(targetUserId);

      socket.emit('userOnlineStatus', {
        userId: targetUserId,
        isOnline,
      });
    });

    // ==================== DISCONNECT ====================
    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id);
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
};