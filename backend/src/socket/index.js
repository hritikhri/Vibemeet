// backend/socket/index.js
const { onlineUsers, userLastSeen, sendActivityOnlineUsers } = require("./utils");

const registerPrivateChatHandlers = require("./privateChat");
const registerGroupChatHandlers = require("./groupChat");
const registerLikeCommentHandlers = require("./likeComment");

exports.setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    const shared = { onlineUsers, userLastSeen, sendActivityOnlineUsers };

    // ====================== AUTHENTICATE ======================
    socket.on("authenticate", (userData) => {
      if (!userData?.userId) return;

      const { userId, name, avatar } = userData;

      onlineUsers.set(socket.id, { userId, name: name || "Unknown", avatar });

      socket.join(`user_${userId}`);
      userLastSeen.delete(userId);
      socket.join(`user_${userId}`);   // For targeted delivery/read events
      console.log(`✅ User ${userId} (${name}) is now ONLINE`);

      io.emit("userOnlineStatus", { userId, isOnline: true });
    });

    // Register all feature handlers
    registerPrivateChatHandlers(io, socket, shared);
    registerGroupChatHandlers(io, socket, shared);
    registerLikeCommentHandlers(io, socket, shared);

    // ====================== ONLINE STATUS ======================
    socket.on("getOnlineStatus", (targetUserId) => {
      const isOnline = Array.from(onlineUsers.values()).some(u => u.userId === targetUserId);
      const lastSeenTime = userLastSeen.get(targetUserId);

      socket.emit("userOnlineStatus", {
        userId: targetUserId,
        isOnline,
        lastSeen: !isOnline && lastSeenTime ? lastSeenTime : null,
      });
    });

    // ====================== DISCONNECT ======================
    socket.on("disconnect", () => {
      const userInfo = onlineUsers.get(socket.id);
      if (userInfo) {
        onlineUsers.delete(socket.id);
        userLastSeen.set(userInfo.userId, new Date());

        io.emit("userOnlineStatus", {
          userId: userInfo.userId,
          isOnline: false,
          lastSeen: new Date(),
        });
      }
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};