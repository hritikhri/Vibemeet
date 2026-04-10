const cloudinary =require ('../config/cloudinary.js');
const streamifier =require( 'streamifier');
const PrivateMessage = require('../models/PrivateMessage.js');

exports.getPrivateChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    // console.log(userId,currentUserId)
    console.log(`Fetching chat between ${currentUserId} and ${userId}`);

    const messages = await PrivateMessage.find({
      $or: [
        { from: currentUserId, to: userId },
        { from: userId, to: currentUserId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('from', 'name avatar username')
    .populate('to', 'name avatar username');

    console.log(`Found ${messages.length} messages`);
    // console.log(messages)
    res.json({ messages });
  } catch (error) {
    console.error("Error in getPrivateChat:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.createMessage= async (req, res) => {
  try {
    const { text } = req.body;
    const fromUserId = req.user.id;
    const toUserId = req.params.userId;

    const message = await PrivateMessage.create({
      from: fromUserId,
      to: toUserId,
      text
    });
    console.log(message)
    res.json({ message });
  } catch (error) {
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