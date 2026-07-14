// controllers/chatController.js
const cloudinary = require("../config/cloudinary.js");
const streamifier = require("streamifier");
const PrivateMessage = require("../models/PrivateMessage.js");
const mongoose = require("mongoose");

function privateRoom(idA, idB) {
  return String(idA) < String(idB)
    ? `private_${idA}_${idB}`
    : `private_${idB}_${idA}`;
}

/**
 * GET /chats
 * Returns all conversations with last message + unread count
 */
exports.getMyChats = async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.user.id);

    const conversations = await PrivateMessage.aggregate([
      {
        $match: {
          $or: [{ from: currentUserId }, { to: currentUserId }],
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$from", currentUserId] },
              "$to",
              "$from",
            ],
          },
          lastMessage: { $last: "$$ROOT" },
          lastMessageAt: { $max: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$to", currentUserId] },
                    { $eq: ["$isRead", false] },
                    { $ne: ["$deleted", true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "otherUser",
        },
      },
      { $unwind: "$otherUser" },
      {
        $project: {
          _id: 0,
          otherUser: {
            _id: "$otherUser._id",
            name: "$otherUser.name",
            username: "$otherUser.username",
            avatar: "$otherUser.avatar",
          },
          lastMessage: {
            text: {
              $cond: [
                { $eq: ["$lastMessage.deleted", true] },
                "🚫 Message deleted",
                "$lastMessage.text",
              ],
            },
            image: {
              $cond: [
                { $eq: ["$lastMessage.deleted", true] },
                null,
                "$lastMessage.image",
              ],
            },
            voiceNote: {
              $cond: [
                { $eq: ["$lastMessage.deleted", true] },
                null,
                "$lastMessage.voiceNote",
              ],
            },
            createdAt: "$lastMessage.createdAt",
            fromMe: { $eq: ["$lastMessage.from", currentUserId] },
            deleted: "$lastMessage.deleted",
          },
          lastMessageAt: 1,
          unreadCount: 1,
        },
      },
    ]);

    res.json(conversations);
  } catch (error) {
    console.error("getMyChats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /chats/private/:userId
 * Returns messages with status field + marks them as read
 */
exports.getPrivateChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const rawMessages = await PrivateMessage.find({
      $or: [
        { from: currentUserId, to: userId },
        { from: userId, to: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("from", "name avatar username")
      .populate("to", "name avatar username")
      .populate({
        path: "replyTo",
        select: "text image voiceNote from deleted",
        populate: { path: "from", select: "name" },
      });

    // Mark all received messages as read
    await PrivateMessage.updateMany(
      { from: userId, to: currentUserId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    // Add computed status field
    const messages = rawMessages.map((msg) => {
      const obj = msg.toObject();
      if (String(obj.from?._id || obj.from) === String(currentUserId)) {
        // My message - compute status
        if (obj.isRead) obj.status = "read";
        else if (obj.delivered) obj.status = "delivered";
        else obj.status = "sent";
      }
      return obj;
    });

    res.json({ messages });
  } catch (error) {
    console.error("getPrivateChat error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /chats/private/:userId  (HTTP fallback)
 */
exports.createMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const fromUserId = req.user.id;
    const toUserId = req.params.userId;

    const message = await PrivateMessage.create({
      from: fromUserId,
      to: toUserId,
      text,
      isRead: false,
      delivered: false,
    });

    const populated = await message.populate("from", "name avatar username");
    res.json({ message: populated });
  } catch (error) {
    console.error("createMessage error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /chats/private/:userId/image
 * Upload image to Cloudinary + save + emit via socket
 */
exports.uploadPrivateImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file uploaded" });
    }

    const fromUserId = req.user.id;
    const toUserId = req.params.userId;

    if (!toUserId) {
      return res.status(400).json({ success: false, message: "Recipient user ID is required" });
    }

    // Upload to Cloudinary
    const uploadToCloudinary = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "vibemeet/chat",
            resource_type: "image",
            quality: "auto",
            fetch_format: "auto",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

    const cloudinaryResult = await uploadToCloudinary();
    const imageUrl = cloudinaryResult.secure_url;

    const savedMessage = await PrivateMessage.create({
      from: fromUserId,
      to: toUserId,
      text: req.body.text || undefined,
      image: imageUrl,
      replyTo: req.body.replyTo || null,
      isRead: false,
      delivered: false,
    });

    const messageToSend = {
      _id: savedMessage._id,
      from: fromUserId,
      to: toUserId,
      text: savedMessage.text,
      image: imageUrl,
      replyTo: savedMessage.replyTo,
      createdAt: savedMessage.createdAt,
      status: "sent",
    };

    const room = privateRoom(fromUserId, toUserId);
    const io = req.app.get("io");

    if (io) {
      io.to(room).emit("newPrivateMessage", messageToSend);
      io.to(`user_${toUserId}`).emit("newPrivateMessage", messageToSend);
    }

    res.status(200).json({
      success: true,
      message: "Image sent successfully",
      imageUrl,
      messageId: savedMessage._id,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ success: false, message: "Failed to send image" });
  }
};