// models/PrivateMessage.js
const mongoose = require("mongoose");

const privateMessageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    default: "",
  },
  image: {
    type: String, // Cloudinary URL
  },
  voiceNote: {
    type: String, // Cloudinary URL
  },
  voiceDuration: {
    type: Number,
    default: 0,
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PrivateMessage",
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  delivered: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  // NEW: soft delete support
  deleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for performance
privateMessageSchema.index({ from: 1, to: 1, createdAt: -1 });
privateMessageSchema.index({ to: 1, isRead: 1 });
privateMessageSchema.index({ from: 1, delivered: 1 });

module.exports = mongoose.model("PrivateMessage", privateMessageSchema);