const PrivateMessage = require('../models/PrivateMessage.js');

exports.getPrivateChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

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

    res.json({ messages });
  } catch (error) {
    console.error("Error in getPrivateChat:", error);
    res.status(500).json({ message: error.message });
  }
};