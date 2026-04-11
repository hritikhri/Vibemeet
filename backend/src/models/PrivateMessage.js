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
    type: String, default:"",
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

// Index for fast conversation lookups
privateMessageSchema.index({ from: 1, to: 1, createdAt: -1 });
privateMessageSchema.index({ to: 1, read: 1 });


module.exports = mongoose.model('PrivateMessage', privateMessageSchema);