const mongoose =require ('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, sparse: true },           // Optional for Google users
  googleId: { type: String, sparse: true, unique: true },
  avatar: { type: String, default: 'https://i.pravatar.cc/300' },
  bio: { type: String, default: '' },
  interests: [{ type: String }],
  mood: { type: String, default: 'social' },
  location: { 
    lat: { type: Number, default: 28.6139 },
    lng: { type: Number, default: 77.2090 }
  },
  isVerified: { type: Boolean, default: true },       // Google users are auto-verified
  otp: String,
  otpExpiry: Date,
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default:[] }],
   following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
  joinedActivities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Activity' }],
  friendRequests: [{ 
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'User',default:[],
}],
sentFriendRequests: [{ 
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'User',
  default:[],
}],
resetPasswordToken: {
  type: String,
  default: null
},
resetPasswordExpires: {
  type: Date,
  default: null
}
}, { timestamps: true });


module.exports= mongoose.model('User', userSchema);