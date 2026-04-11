const Activity = require("../models/Activity.js");
const User = require("../models/User.js");
const Notification = require('../models/Notification.js');
const cloudinary = require('../config/cloudinary.js');
const streamifier = require('streamifier');
const { calculateFeedScore, calculateExploreScore } = require("../utils/algorithms.js");
const haversineDistance = require("../utils/haversine.js");

exports.createActivity = async (req, res) => {
  try {
    const activity = await Activity.create({
      ...req.body,
      creator: req.user.id,
      participants: [req.user.id],
    });
    await User.findByIdAndUpdate(req.user.id, {
      $push: { joinedActivities: activity._id },
    });
    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllActivities = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    let activities = await Activity.find()
      .populate("creator", "name avatar username")
      .populate({
        path: "comments.user",  select: "name avatar username"                  // First populate the comments array
      })
      .sort({ createdAt: -1 })
      .lean();                               // Important for performance + easier object handling
    // const populated = await activity.populate({ path: "comments.user", select: "name avatar" });

    const now = Date.now();

    activities = activities.map((act) => {
      const distance = haversineDistance(
        user.location.lat, 
        user.location.lng,
        act.location.lat, 
        act.location.lng
      );

      return { 
        ...act, 
        distance 
      };
    });

    activities.sort((a, b) => 
      calculateFeedScore(b, user, now) - calculateFeedScore(a, user, now)
    );

    res.json(activities);
  } catch (error) {
    console.error("Error in getAllActivities:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.exploreActivities = async (req, res) => {
  try {
    const { radius = 15, search } = req.query;
    const user = await User.findById(req.user.id);

    let activityQuery = {};
    if (search) {
      activityQuery.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { interests: { $regex: search, $options: "i" } },
      ];
    }

    let activities = await Activity.find(activityQuery)
      .populate("creator", "name avatar username")
      .sort({ createdAt: -1 });

    const now = Date.now();
    activities = activities
      .map((act) => {
        const distance = haversineDistance(
          user.location.lat, user.location.lng,
          act.location.lat, act.location.lng,
        );
        return { ...act.toObject(), distance };
      })
      .filter((act) => act.distance <= Number(radius));

    activities.sort(
      (a, b) => calculateExploreScore(b, user, now) - calculateExploreScore(a, user, now),
    );

    // Search users by name/username separately
    let users = [];
    if (search && search.trim() !== "") {
      users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
        ],
        _id: { $ne: req.user.id }, // exclude self
      })
        .select("name username avatar bio interests")
        .limit(10);

      // Check friend/follow status for each user
      const currentUser = await User.findById(req.user.id).select("friends following sentFriendRequests");
      users = users.map((u) => ({
        ...u.toObject(),
        isFriend: currentUser.friends.some(f => f.toString() === u._id.toString()),
        isFollowing: currentUser.following.some(f => f.toString() === u._id.toString()),
        requestSent: currentUser.sentFriendRequests.some(f => f.toString() === u._id.toString()),
      }));
    }

    res.json({ activities, users });
  } catch (error) {
    console.error("exploreActivities error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate("creator", "name avatar username")
      .populate("participants", "name avatar username")
      .populate("likes", "name avatar")
      .populate({ path: "comments.user", select: "name avatar" })
      .populate({
        path: "messages",
        select: "text image createdAt seenBy",
        populate: { path: "sender", select: "name avatar" },
        options: { sort: { createdAt: 1 } }
      })
      .populate({ path: "messages.seenBy", select: "name avatar" });

    if (!activity) return res.status(404).json({ message: "Activity not found" });
    res.json(activity);
  } catch (error) {
    console.error("Error fetching activity:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.requestJoin = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: "Activity not found" });

    if (!activity.pendingRequests.includes(req.user.id)) {
      activity.pendingRequests.push(req.user.id);
      await activity.save();
    }
    res.json({ message: "Join request sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.likeActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id).populate("creator", "name avatar");
    if (!activity) return res.status(404).json({ message: "Activity not found" });

    const alreadyLiked = activity.likes.includes(req.user.id);
    if (alreadyLiked) {
      activity.likes = activity.likes.filter(id => id.toString() !== req.user.id);
    } else {
      activity.likes.push(req.user.id);
      if (activity.creator._id.toString() !== req.user.id) {
        const liker = await User.findById(req.user.id).select("name avatar");
        await Notification.create({
          user: activity.creator._id,
          type: "like",
          fromUser: req.user.id,
          activity: activity._id,
          message: `${liker.name} liked your activity "${activity.title}"`,
        });
      }
    }

    await activity.save();
    res.json(activity);
  } catch (error) {
    console.error("Like error:", error);
    res.status(500).json({ message: "Failed to like activity" });
  }
};

exports.addComment = async (req, res) => {
  try {
    console.log(req.user)
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: "Activity not found" });
    activity.comments.push({ user: req.user.id, text: req.body.text });
    await activity.save();

    const populated = await activity.populate({ path: "comments.user", select: "name avatar" });
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FIX: was `conosle.log` (typo) → removed
exports.addMessage = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: "Activity not found" });

    const message = {
      sender: req.user.id,
      text: req.body.text,
      createdAt: new Date(),
      seenBy: [req.user.id],
    };

    activity.messages.push(message);
    await activity.save();

    const io = req.app.get("io");
    io.to(`activity_${req.params.id}`).emit("newMessage", {
      ...message,
      sender: { _id: req.user.id, name: req.user.name, avatar: req.user.avatar },
    });

    res.json({ message: "Message sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateActivity = async (req, res) => {
  try {
    const { title, description, interests } = req.body;
    const activity = await Activity.findOne({ _id: req.params.id, creator: req.user.id });
    if (!activity) return res.status(404).json({ message: "Activity not found or you are not the creator" });

    activity.title = title || activity.title;
    activity.description = description || activity.description;
    if (interests) activity.interests = interests;
    activity.updatedAt = Date.now();

    const updatedActivity = await activity.save();
    await updatedActivity.populate("creator", "name avatar username");
    res.json(updatedActivity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findOne({ _id: req.params.id, creator: req.user.id });
    if (!activity) return res.status(404).json({ message: "Activity not found or you are not the creator" });

    await Notification.deleteMany({ activity: activity._id });
    await activity.deleteOne();
    res.json({ message: "Activity deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.uploadActivityImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image file uploaded" });

    const { id: activityId } = req.params;
    const senderId = req.user.id;

    const uploadToCloudinary = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "vibemeet/activities", resource_type: "image" },
          (error, result) => (result ? resolve(result) : reject(error))
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

    const cloudinaryResult = await uploadToCloudinary();
    const imageUrl = cloudinaryResult.secure_url;

    const newMessage = { sender: senderId, text: "", image: imageUrl, createdAt: new Date(), seenBy: [senderId] };

    const activity = await Activity.findByIdAndUpdate(
      activityId,
      { $push: { messages: newMessage } },
      { new: true }
    );
    if (!activity) return res.status(404).json({ message: "Activity not found" });

    const savedMsg = activity.messages[activity.messages.length - 1];
    const io = req.app.get("io");
    if (io) {
      io.to(`activity_${activityId}`).emit("newMessage", {
        _id: savedMsg._id,
        sender: { _id: senderId },
        image: imageUrl,
        createdAt: newMessage.createdAt,
        seenBy: [senderId],
      });
    }

    res.json({ success: true, message: "Image sent successfully", imageUrl });
  } catch (error) {
    console.error("Cloudinary group image upload error:", error);
    res.status(500).json({ message: "Failed to upload image" });
  }
};