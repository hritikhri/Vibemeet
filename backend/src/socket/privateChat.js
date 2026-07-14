// socket/privateChatHandlers.js
const PrivateMessage = require("../models/PrivateMessage.js");
const User           = require("../models/User.js");
const { createNotification } = require("../controllers/notificationController.js");

function privateRoom(idA, idB) {
  return String(idA) < String(idB)
    ? `private_${idA}_${idB}`
    : `private_${idB}_${idA}`;
}

const registerPrivateChatHandlers = (io, socket, { onlineUsers }) => {

  // ── Join room ───────────────────────────────────────────────────────────────
  socket.on("joinPrivateChat", (otherUserId) => {
    const cur = onlineUsers.get(socket.id);
    if (!cur?.userId || !otherUserId) return;
    const room = privateRoom(cur.userId, otherUserId);
    socket.join(room);
  });

  // ── Send message ────────────────────────────────────────────────────────────
  socket.on("sendPrivateMessage", async (payload, callback) => {
    try {
      const { toUserId, text, image, voiceNote, voiceDuration, replyTo } = payload;
      const fromUser = onlineUsers.get(socket.id);

      if (!fromUser?.userId || !toUserId)
        return callback?.({ success: false, error: "Missing auth or recipient" });
      if (!text?.trim() && !image && !voiceNote)
        return callback?.({ success: false, error: "Empty message" });

      const newMsg = await PrivateMessage.create({
        from: fromUser.userId, to: toUserId,
        text: text?.trim() || "",
        image: image || null,
        voiceNote: voiceNote || null,
        voiceDuration: voiceDuration || 0,
        replyTo: replyTo || null,
        isRead: false, delivered: false,
      });

      const populated = await PrivateMessage.findById(newMsg._id)
        .populate("from", "name avatar")
        .populate("to",   "name avatar")
        .populate("replyTo");

      const msgObj = {
        _id: populated._id,
        from: populated.from._id,
        to:   populated.to._id,
        text: populated.text,
        image: populated.image,
        voiceNote: populated.voiceNote,
        voiceDuration: populated.voiceDuration,
        replyTo: populated.replyTo,
        createdAt: populated.createdAt,
        status: "sent",
      };

      const room = privateRoom(fromUser.userId, toUserId);
      io.to(room).emit("newPrivateMessage", msgObj);
      io.to(`user_${toUserId}`).emit("newPrivateMessage", msgObj);

      // Mark delivered if receiver is online
      const receiverOnline = Array.from(onlineUsers.values())
        .some((u) => String(u.userId) === String(toUserId));
      if (receiverOnline) {
        await PrivateMessage.findByIdAndUpdate(newMsg._id, { delivered: true });
        msgObj.status = "delivered";
        io.to(`user_${fromUser.userId}`).emit("messageDelivered", { messageId: newMsg._id });
      }

      await createNotification(
        toUserId, "message", fromUser.userId, null,
        voiceNote
          ? `🎤 ${fromUser.name} sent a voice message`
          : `New message from ${fromUser.name}`
      ).catch(console.error);

      callback?.({ success: true, message: { ...msgObj, isMe: true } });
    } catch (err) {
      console.error("sendPrivateMessage error:", err);
      callback?.({ success: false, error: "Server error" });
    }
  });

  // ── Delete message (soft) ───────────────────────────────────────────────────
  socket.on("deletePrivateMessage", async ({ messageId }, callback) => {
    try {
      const cur = onlineUsers.get(socket.id);
      if (!cur?.userId) return callback?.({ success: false, error: "Not authenticated" });

      const msg = await PrivateMessage.findOne({ _id: messageId, from: cur.userId });
      if (!msg) return callback?.({ success: false, error: "Not found or unauthorized" });

      await PrivateMessage.findByIdAndUpdate(messageId, {
        deleted: true, text: "", image: null, voiceNote: null,
      });

      const room = privateRoom(cur.userId, String(msg.to));
      io.to(room).emit("messageDeleted", { messageId });
      io.to(`user_${msg.to}`).emit("messageDeleted", { messageId });

      callback?.({ success: true });
    } catch (err) {
      console.error("deletePrivateMessage error:", err);
      callback?.({ success: false, error: "Server error" });
    }
  });

  // ── Mark delivered ──────────────────────────────────────────────────────────
  socket.on("markMessageAsDelivered", async ({ messageId }) => {
    try {
      const cur = onlineUsers.get(socket.id);
      if (!cur?.userId) return;
      const updated = await PrivateMessage.findOneAndUpdate(
        { _id: messageId, to: cur.userId, delivered: false },
        { delivered: true }, { new: true }
      );
      if (updated)
        io.to(`user_${updated.from}`).emit("messageDelivered", { messageId });
    } catch (err) { console.error(err); }
  });

  // ── Mark read ───────────────────────────────────────────────────────────────
  socket.on("markMessageAsRead", async ({ messageId }) => {
    try {
      const cur = onlineUsers.get(socket.id);
      if (!cur?.userId) return;
      const updated = await PrivateMessage.findOneAndUpdate(
        { _id: messageId, to: cur.userId, isRead: false },
        { isRead: true, readAt: new Date() }, { new: true }
      );
      if (updated)
        io.to(`user_${updated.from}`).emit("messageRead", { messageId });
    } catch (err) { console.error(err); }
  });

  // ── Bulk mark conversation read ─────────────────────────────────────────────
  socket.on("markConversationRead", async ({ fromUserId }) => {
    try {
      const cur = onlineUsers.get(socket.id);
      if (!cur?.userId) return;
      const result = await PrivateMessage.updateMany(
        { from: fromUserId, to: cur.userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      if (result.modifiedCount > 0)
        io.to(`user_${fromUserId}`).emit("conversationRead", { byUserId: cur.userId });
    } catch (err) { console.error(err); }
  });

  // ── Typing indicator ────────────────────────────────────────────────────────
  // Forwards typing events to the private room — no DB needed
  socket.on("typing", ({ toUserId, isTyping }) => {
    const fromUser = onlineUsers.get(socket.id);
    if (!fromUser?.userId || !toUserId) return;
    const room = privateRoom(fromUser.userId, toUserId);
    // socket.to() excludes sender — only recipient(s) in the room receive this
    socket.to(room).emit("typing", { fromUserId: fromUser.userId, isTyping });
  });

  // ── Get online status — includes lastSeen from DB ──────────────────────────
  socket.on("getOnlineStatus", async (targetUserId) => {
    const cur = onlineUsers.get(socket.id);
    if (!cur) return;

    const isOnline = Array.from(onlineUsers.values())
      .some((u) => String(u.userId) === String(targetUserId));

    let lastSeen = null;
    if (!isOnline) {
      try {
        const targetUser = await User.findById(targetUserId).select("lastSeen");
        lastSeen = targetUser?.lastSeen ?? null;
      } catch (_) {}
    }

    socket.emit("userOnlineStatus", {
      userId: targetUserId,
      online: isOnline,
      lastSeen,
    });
  });
};

module.exports = registerPrivateChatHandlers;