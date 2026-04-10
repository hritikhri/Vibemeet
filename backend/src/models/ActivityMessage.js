const mongoose = require('mongoose');

const activityMessageSchema = new mongoose.Schema({
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  image:{
    type:String,
  }
}, {
  timestamps: true   // automatically adds createdAt and updatedAt
});

module.exports = mongoose.model('ActivityMessage', activityMessageSchema);