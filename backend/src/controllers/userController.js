const User = require("../models/User.js");
const haversineDistance = require("../utils/haversine.js");
const Activity = require("../models/Activity.js");
const Notification = require("../models/Notification.js");


// PUT /users/mood
exports.mood =async (req, res) => {
  const { mood } = req.body;
  await User.findByIdAndUpdate(req.user._id, { mood });
  res.json({ success: true });
};

exports.batch = async (req, res) => {
  const { userIds } = req.body;
  if (!userIds || !Array.isArray(userIds)) return res.status(400).json([]);

  const users = await User.find({ _id: { $in: userIds } })
    .select('name username avatar');   // Only needed fields

  res.json(users);
};

// POST /users/unfriend
exports.unfriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, {
      $pull: { friends: friendId }
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: userId }
    });

    res.json({ message: "Unfriended successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to unfriend" });
  }
};
// Send Friend Request
exports.sendFriendRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: "Cannot send request to yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already friends (using _id string comparison for safety)
    if (currentUser.friends.some(id => id.toString() === targetUserId)) {
      return res.status(400).json({ message: "You are already friends" });
    }

    // Check if request already sent
    if (targetUser.friendRequests.some(id => id.toString() === currentUserId)) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // Add using $addToSet to prevent any future duplicates
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { 
        friends: targetUserId,           // Add to my friends list
        sentFriendRequests: targetUserId // Add to my sent requests
      }
    });

    await User.findByIdAndUpdate(targetUserId, {
      $addToSet: { 
        friendRequests: currentUserId    // Add to their received requests
      }
    });

    // Send notification
    await Notification.create({
      user: targetUserId,
      type: "friend_request",
      fromUser: currentUserId,
      message: `${currentUser.name} sent you a friend request`,
    });

    res.json({ message: "Friend request sent successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Get current logged-in user (me)
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate({
        path: 'friends',                    // Populate the friends array
        select: 'name username avatar',     // Only fetch these fields (add more if needed)
        model: 'User'                       // Explicit model name (safe practice)
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error in getMe:", error);
    res.status(500).json({ 
      message: "Failed to load user profile",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("friends", "name username avatar")
      .populate("joinedActivities", "title");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, interests, mood } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio, interests, mood },
      { new: true },
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSuggestedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const users = await User.find({
      _id: { $ne: req.user.id },
      interests: { $in: currentUser.interests },
    }).limit(8);

    const suggested = users.map((user) => {
      const distance = haversineDistance(
        currentUser.location.lat,
        currentUser.location.lng,
        user.location.lat,
        user.location.lng,
      );
      return { ...user.toObject(), distance: Math.round(distance) };
    });

    res.json(suggested);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    // not gerrint the req.phrams.id 
    const user = await User.findById(req.params.id)
      .select("-password -otp -otpExpiry")
      .populate("friends", "name username avatar");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ creator: req.params.id })
      .populate("creator", "name avatar")
      .sort({ createdAt: -1 });

    res.json(activities);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Accept Friend Request
exports.acceptFriendRequest = async (req, res) => {
  try {
    const requesterId = req.params.id;
    const user = await User.findById(req.user.id);
    const requester = await User.findById(requesterId);

    if (!user.friendRequests.includes(requesterId)) {
      return res.status(400).json({ message: "No pending friend request" });
    }

    // Add each other as friends
    user.friendRequests = user.friendRequests.filter(
      (id) => id.toString() !== requesterId,
    );
    user.friends.push(requesterId);

    requester.sentFriendRequests = requester.sentFriendRequests.filter(
      (id) => id.toString() !== req.user.id,
    );
    requester.friends.push(req.user.id);

    await user.save();
    await requester.save();

    res.json({ message: "Friend request accepted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject Friend Request
exports.rejectFriendRequest = async (req, res) => {
  try {
    const requesterId = req.params.id;
    const user = await User.findById(req.user.id);

    user.friendRequests = user.friendRequests.filter(
      (id) => id.toString() !== requesterId,
    );
    await user.save();

    res.json({ message: "Friend request rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
