const Notification= require( '../models/Notification.js');
const User= require( '../models/User.js');

// Get all notifications for logged-in user
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .populate('requireUser', 'name avatar username')
      .populate('activity', 'title')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// backend/controllers/notificationController.js
exports.createNotification = async (userId, type, fromUserId, activityId = null, message) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      requireUser: fromUserId,
      activity: activityId,
      message: message || "New notification",
      read: false
    });

    // Real-time push
    const io = global.io;
    if (io) {
      io.to(`user_${userId}`).emit('newNotification', {
        _id: notification._id,
        type,
        from: fromUserId,
        message,
        activity: activityId,
        createdAt: notification.createdAt,
        read: false
      });
    }
    return notification;
  } catch (error) {
    console.error('Notification creation failed:', error);
    return null;
  }
};