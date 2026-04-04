const Activity = require("../models/Activity.js");
const User = require("../models/User.js");
const Notification= require( '../models/Notification.js');
const {calculateFeedScore,calculateExploreScore,} = require("../utils/algorithms.js");
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
      .populate("creator", "name avatar")
      .sort({ createdAt: -1 });

    const now = Date.now();
    activities = activities.map((act) => {
      const distance = haversineDistance(
        user.location.lat,
        user.location.lng,
        act.location.lat,
        act.location.lng,
      );
      return { ...act.toObject(), distance };
    });

    activities.sort(
      (a, b) =>
        calculateFeedScore(b, user, now) - calculateFeedScore(a, user, now),
    );

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exploreActivities = async (req, res) => {
  try {
    const { radius = 15, search } = req.query;
    const user = await User.findById(req.user.id);

    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    let activities = await Activity.find(query)
      .populate("creator", "name avatar")
      .sort({ createdAt: -1 });

    const now = Date.now();
    activities = activities
      .map((act) => {
        const distance = haversineDistance(
          user.location.lat,
          user.location.lng,
          act.location.lat,
          act.location.lng,
        );
        return { ...act.toObject(), distance };
      })
      .filter((act) => act.distance <= radius);

    activities.sort(
      (a, b) =>
        calculateExploreScore(b, user, now) -
        calculateExploreScore(a, user, now),
    );

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate("creator", "name avatar")
      .populate("participants", "name avatar")
      .populate("comments.user", "name avatar");
    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.requestJoin = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity)
      return res.status(404).json({ message: "Activity not found" });

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
    const activity = await Activity.findById(req.params.id).populate(
      "creator",
      "name avatar",
    ); // Important for notification

    if (!activity)
      return res.status(404).json({ message: "Activity not found" });

    const alreadyLiked = activity.likes.includes(req.user.id);

    if (alreadyLiked) {
      activity.likes = activity.likes.filter(
        (id) => id.toString() !== req.user.id,
      );
    } else {
      activity.likes.push(req.user.id);

      // Notify creator if it's not their own activity
      if (activity.creator._id.toString() !== req.user.id) {
        const liker = await User.findById(req.user.id).select("name avatar");
        
        await Notification.create({
          user: activity.creator._id,
          type: "like",
          requireUser: req.user.id,
          activity: activity._id,
          message: `${liker.name} liked your activity "${activity.title}`,
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
    const activity = await Activity.findById(req.params.id);
    activity.comments.push({
      user: req.user.id,
      text: req.body.text,
    });
    await activity.save();
    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Save message to database + broadcast via socket
exports.addMessage = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity)
      return res.status(404).json({ message: "Activity not found" });

    const message = {
      sender: req.user.id,
      text: req.body.text,
      createdAt: new Date(),
    };

    activity.messages.push(message);
    await activity.save();

    // Broadcast to all in room
    const io = req.app.get("io"); // Make sure you attach io to app in server.js
    io.to(`activity_${req.params.id}`).emit("newMessage", {
      ...message,
      sender: {
        _id: req.user.id,
        name: req.user.name || "User",
        avatar: req.user.avatar,
      },
    });

    res.json({ message: "Message sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Activity
exports.updateActivity = async (req, res) => {
  try {
    const { title, description, interests } = req.body;

    const activity = await Activity.findOne({
      _id: req.params.id,
      creator: req.user.id
    });

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found or you are not the creator' });
    }

    activity.title = title || activity.title;
    activity.description = description || activity.description;
    if (interests) activity.interests = interests;

    activity.updatedAt = Date.now();

    const updatedActivity = await activity.save();

    // Populate creator before sending response
    await updatedActivity.populate('creator', 'name avatar');

    res.json(updatedActivity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Activity
exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      creator: req.user.id
    });

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found or you are not the creator' });
    }

    // Optional: Delete related notifications, messages, etc.
    await Notification.deleteMany({ activity: activity._id });
    // You can also delete messages from chats if you have a separate collection

    await activity.deleteOne();

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
