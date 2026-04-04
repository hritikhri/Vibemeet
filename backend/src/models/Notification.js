const mongoose= require( 'mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['join_request', 'invite', 'request_accepted','friend_request', 'message','like'], 
    required: true 
  },
  requireUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports= mongoose.model('Notification', notificationSchema);