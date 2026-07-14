// models/Activity.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username:{ type: String},
  name: { type: String },
  avatar: { type: String },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const activitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  images:[{ type: String,}],
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  location: {
    lat: { type: Number, },
    lng: { type: Number, }
  },
  time: { type: Date, required: true },
  interests: [{ type: String, trim: true }],

  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],

  messages: [{
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },

    text: { type: String, trim: true },
    images: [{ type: String }],
    voiceNote: { type: String },
    voiceDuration: { type: Number, default: 0 },

    // Reply feature - NO ref here (it's just an ObjectId)
    replyTo: { 
      type: mongoose.Schema.Types.ObjectId   // Removed ref
    },

    seenBy: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }],

    createdAt: { type: Date, default: Date.now }
  }],

  createdAt: { type: Date, default: Date.now }
});

activitySchema.index({ "messages.createdAt": 1 });

module.exports = mongoose.model('Activity', activitySchema);