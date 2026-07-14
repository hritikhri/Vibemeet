// backend/socket/groupChat.js
const Activity = require("../models/Activity.js");

const registerGroupChatHandlers = (io, socket, { onlineUsers }) => {

  socket.on("joinActivity", (activityId) => {
    const userInfo = onlineUsers.get(socket.id);
    if (!userInfo || !activityId) return;

    socket.join(`activity_${activityId}`);

    const room = io.sockets.adapter.rooms.get(`activity_${activityId}`);
    io.to(`activity_${activityId}`).emit("activityOnlineCount", {
      activityId,
      count: room ? room.size : 1
    });
  });
  // Inside registerGroupChatHandlers
socket.on("markMessageSeen", async ({ activityId, messageId }) => {
  const userInfo = onlineUsers.get(socket.id);
  if (!userInfo || !activityId || !messageId) return;

  try {
    await Activity.updateOne(
      { _id: activityId, "messages._id": messageId },
      { $addToSet: { "messages.$.seenBy": userInfo.userId } }
    );

    // Broadcast updated seenBy list
    const updatedActivity = await Activity.findOne(
      { _id: activityId, "messages._id": messageId }
    ).populate("messages.seenBy", "name avatar");

    const message = updatedActivity?.messages.id(messageId);

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

// backend/socket/groupChat.js  (Updated sendMessage)
socket.on("sendMessage", async ({ activityId, text, image, voiceNote, voiceDuration, replyTo }, callback) => {
  const senderInfo = onlineUsers.get(socket.id);
  if (!senderInfo || !activityId) {
    return callback?.({ success: false, error: "Invalid data" });
  }

  try {
    const newMessage = {
      sender: senderInfo.userId,
      text: text?.trim() || "",
      image: image || null,
      voiceNote: voiceNote || null,
      voiceDuration: voiceDuration || 0,
      replyTo: replyTo || null,
      seenBy: [senderInfo.userId],        // Sender has seen their own message
      createdAt: new Date()
    };

    const updatedActivity = await Activity.findByIdAndUpdate(
      activityId,
      { $push: { messages: newMessage } },
      { new: true }
    );

    if (!updatedActivity) {
      return callback?.({ success: false, error: "Activity not found" });
    }

    const savedMsg = updatedActivity.messages[updatedActivity.messages.length - 1];

    const messageToSend = {
      _id: savedMsg._id,
      sender: {
        _id: senderInfo.userId,
        name: senderInfo.name,
        avatar: senderInfo.avatar,
      },
      text: savedMsg.text,
      image: savedMsg.image,
      voiceNote: savedMsg.voiceNote,
      voiceDuration: savedMsg.voiceDuration,
      replyTo: savedMsg.replyTo,
      createdAt: savedMsg.createdAt,
      seenBy: savedMsg.seenBy,
      status: "sent"
    };

    io.to(`activity_${activityId}`).emit("newMessage", messageToSend);
    callback?.({ success: true, message: messageToSend });
  } catch (err) {
    console.error("Group sendMessage error:", err);
    callback?.({ success: false, error: "Server error" });
  }
});

  // Typing
  socket.on("typing", ({ activityId, isTyping }) => {
    const userInfo = onlineUsers.get(socket.id);
    if (!userInfo || !activityId) return;
    socket.to(`activity_${activityId}`).emit("typing", { name: userInfo.name, isTyping });
  });
};

module.exports = registerGroupChatHandlers;