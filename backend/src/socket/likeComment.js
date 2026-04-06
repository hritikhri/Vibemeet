// backend/socket/likeComment.js

const registerLikeCommentHandlers = (io, socket, { onlineUsers }) => {

  socket.on("likeActivity", async ({ activityId }) => {
    const userInfo = onlineUsers.get(socket.id);
    if (!userInfo) return;

    // You can add DB update here if needed

    io.to(`activity_${activityId}`).emit("activityLiked", {
      activityId,
      userId: userInfo.userId,
      name: userInfo.name,
    });
  });

  socket.on("addComment", async ({ activityId, text }) => {
    const userInfo = onlineUsers.get(socket.id);
    if (!userInfo) return;

    io.to(`activity_${activityId}`).emit("newComment", {
      activityId,
      user: {
        _id: userInfo.userId,
        name: userInfo.name,
        avatar: userInfo.avatar
      },
      text,
      createdAt: new Date(),
    });
  });
};

module.exports = registerLikeCommentHandlers;