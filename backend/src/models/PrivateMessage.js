const mongoose = require('mongoose');

const privateMessageSchema = new mongoose.Schema({
  from: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  to: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  text: { 
    type: String 
  },
  image: {
    type: String
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  delivered: {           // NEW - for grey double tick
    type: Boolean,
    default: false
  },
  readAt: {              // NEW - optional
    type: Date
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for faster queries
privateMessageSchema.index({ from: 1, to: 1, createdAt: -1 });

module.exports = mongoose.model('PrivateMessage', privateMessageSchema);