const cloudinary =require ('../config/cloudinary.js');
const streamifier =require( 'streamifier');
const PrivateMessage = require('../models/PrivateMessage.js');
const mongoose = require('mongoose');

/**
 * GET /chats
 * Returns all conversations the current user has participated in,
 * sorted by most recent message, with last message preview + unread count.
 */
exports.getMyChats = async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.user.id);

    const conversations = await PrivateMessage.aggregate([
      // 1. Only messages involving the current user
      {
        $match: {
          $or: [{ from: currentUserId }, { to: currentUserId }],
        },
      },

      // 2. Group by the "conversation partner" (the other person)
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$from', currentUserId] },
              '$to',    // I sent → other person is `to`
              '$from',  // I received → other person is `from`
            ],
          },
          lastMessage: { $last: '$$ROOT' },   // most recent message in this group
          lastMessageAt: { $max: '$createdAt' },
          // Count messages sent TO me that I haven't read
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$to', currentUserId] },
                    { $eq: ['$read', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },

      // 3. Sort by most recent first
      { $sort: { lastMessageAt: -1 } },

      // 4. Populate the other user's details
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'otherUser',
        },
      },
      { $unwind: '$otherUser' },

      // 5. Populate sender of last message (for "You: ..." prefix)
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.from',
          foreignField: '_id',
          as: 'lastMessageSender',
        },
      },
      { $unwind: { path: '$lastMessageSender', preserveNullAndEmptyArrays: true } },

      // 6. Shape the output
      {
        $project: {
          _id: 0,
          otherUser: {
            _id: '$otherUser._id',
            name: '$otherUser.name',
            username: '$otherUser.username',
            avatar: '$otherUser.avatar',
          },
          lastMessage: {
            text: '$lastMessage.text',
            image: '$lastMessage.image',
            createdAt: '$lastMessage.createdAt',
            fromMe: { $eq: ['$lastMessage.from', currentUserId] },
          },
          lastMessageAt: 1,
          unreadCount: 1,
        },
      },
    ]);

    res.json(conversations);
  } catch (error) {
    console.error('getMyChats error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /chats/private/:userId
 * Returns all messages between currentUser and userId, marks received ones as read.
 */
exports.getPrivateChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const messages = await PrivateMessage.find({
      $or: [
        { from: currentUserId, to: userId },
        { from: userId, to: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('from', 'name avatar username')
      .populate('to', 'name avatar username');

    // Mark all received messages as read
    await PrivateMessage.updateMany(
      { from: userId, to: currentUserId, read: false },
      { $set: { read: true } }
    );

    res.json({ messages });
  } catch (error) {
    console.error('getPrivateChat error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /chats/private/:userId
 * HTTP fallback to create a message (socket is preferred).
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
      read: false,
    });

    const populated = await message.populate('from', 'name avatar username');
    res.json({ message: populated });
  } catch (error) {
    console.error('createMessage error:', error);
    res.status(500).json({ message: error.message });
  }
};
// Upload Image to Cloudinary + Save in PrivateMessage
exports.uploadPrivateImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image file uploaded' 
      });
    }

    const fromUserId = req.user.id;        // Make sure your auth middleware sets req.user.id or req.user._id
    const toUserId = req.params.userId;    // or req.params.otherUserId depending on your route

    if (!toUserId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Recipient user ID is required' 
      });
    }

    // ====================== UPLOAD TO CLOUDINARY ======================
    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'vibemeet/chat',
            resource_type: 'image',
            quality: 'auto',           // Production best practice
            fetch_format: 'auto',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    const cloudinaryResult = await uploadToCloudinary();
    const imageUrl = cloudinaryResult.secure_url;

    // ====================== SAVE MESSAGE WITH PROPER STATUS FIELDS ======================
    const savedMessage = await PrivateMessage.create({
      from: fromUserId,
      to: toUserId,
      text: req.body.text || undefined,     // Support text + image (caption)
      image: imageUrl,
      isRead: false,
      delivered: false,                     // Important for grey double tick
    });

    // Message object to broadcast
    const messageToSend = {
      _id: savedMessage._id,
      from: fromUserId,
      to: toUserId,
      text: savedMessage.text,
      image: imageUrl,
      createdAt: savedMessage.createdAt,
      isRead: false,
      delivered: false,
      status: "sent",
    };

    // ====================== BROADCAST VIA SOCKET ======================
    const room = `private_${Math.min(fromUserId, toUserId)}_${Math.max(fromUserId, toUserId)}`;
    const io = req.app.get('io');

    if (io) {
      io.to(room).emit('newPrivateMessage', messageToSend);
    } else {
      console.warn("Socket.io instance not found on req.app");
    }

    // Optional: Send notification to receiver
    // await createNotification(toUserId, "message", fromUserId, null, `You received an image`);

    res.status(200).json({
      success: true,
      message: 'Image sent successfully',
      imageUrl,
      messageId: savedMessage._id   // Helpful for frontend
    });

  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send image. Please try again.' 
    });
  }
};