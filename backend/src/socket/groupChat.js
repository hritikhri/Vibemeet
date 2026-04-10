// backend/socket/groupChat.js
const Activity = require("../models/Activity.js");

const registerGroupChatHandlers = (io, socket, { onlineUsers, sendActivityOnlineUsers }) => {

  socket.on("joinActivity", (activityId) => {
    const userInfo = onlineUsers.get(socket.id);
    if (!userInfo || !activityId) return;

    socket.join(`activity_${activityId}`);

    const room = io.sockets.adapter.rooms.get(`activity_${activityId}`);
    const count = room ? room.size : 1;

    io.to(`activity_${activityId}`).emit("activityOnlineCount", { activityId, count });
    sendActivityOnlineUsers(io, activityId);
  });

  socket.on("leaveActivity", (activityId) => {
    if (!activityId) return;
    socket.leave(`activity_${activityId}`);

    const room = io.sockets.adapter.rooms.get(`activity_${activityId}`);
    const count = room ? room.size : 0;

    io.to(`activity_${activityId}`).emit("activityOnlineCount", { activityId, count });
    sendActivityOnlineUsers(io, activityId);
  });

  // Send Message
  socket.on("sendMessage", async ({ activityId, text }, callback) => {
    const senderInfo = onlineUsers.get(socket.id);
    if (!senderInfo || !activityId || !text?.trim()) {
      return callback?.({ success: false, error: "Invalid data" });
    }
    console.log(senderInfo)
    try {
      const newMessage = {
        sender: senderInfo.userId,
        text: text.trim(),
        createdAt: new Date(),
        seenBy: [senderInfo.userId]   // Sender has automatically "seen" their own message
      };

      const updatedActivity = await Activity.findByIdAndUpdate(
        activityId,
        { $push: { messages: newMessage } },
        { new: true }
      );

      if (!updatedActivity) {
        return callback?.({ success: false, error: "Activity not found" });
      }

      const messageToSend = {
        _id: updatedActivity.messages[updatedActivity.messages.length - 1]._id,
        sender: {
          _id: senderInfo.userId,
          name: senderInfo.name,
          avatar: senderInfo.avatar,
        },
        text: newMessage.text,
        createdAt: newMessage.createdAt,
        seenBy: [senderInfo.userId]   // Initial seenBy
      };

      io.to(`activity_${activityId}`).emit("newMessage", messageToSend);
      callback?.({ success: true, message: messageToSend });
    } catch (err) {
      console.error("Group message error:", err);
      callback?.({ success: false, error: "Failed to send message" });
    }
  });

  // NEW: Mark Message as Seen
  socket.on("markMessageSeen", async ({ activityId, messageId }) => {
    const userInfo = onlineUsers.get(socket.id);
    if (!userInfo || !activityId || !messageId) return;

    try {
      // Add user to seenBy array (only if not already present)
      await Activity.updateOne(
        { 
          _id: activityId,
          "messages._id": messageId 
        },
        { 
          $addToSet: { "messages.$.seenBy": userInfo.userId } 
        }
      );

      // Get updated seenBy list with populated user info
      const updatedActivity = await Activity.findOne(
        { _id: activityId, "messages._id": messageId }
      ).populate("messages.seenBy", "name avatar");

      const message = updatedActivity.messages.id(messageId);

      if (message) {
        io.to(`activity_${activityId}`).emit("messageSeenUpdate", {
          messageId: message._id,
          seenBy: message.seenBy.map(u => ({
            _id: u._id,
            name: u.name,
            avatar: u.avatar
          }))
        });
      }
    } catch (err) {
      console.error("Mark seen error:", err);
    }
  });

  // Typing
  socket.on("typing", ({ activityId, isTyping }) => {
    const userInfo = onlineUsers.get(socket.id);
    if (!userInfo || !activityId) return;

    socket.to(`activity_${activityId}`).emit("typing", {
      name: userInfo.name,
      isTyping
    });
  });
};

module.exports = registerGroupChatHandlers;