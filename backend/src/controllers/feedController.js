const User =require ('../models/User.js');
const Activity= require( '../models/Activity.js');
const { getSuggestedUsers }= require( './userController.js');

exports.getFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const activities = await Activity.find()
      .populate('creator', 'name avatar')
      .populate('comments.user', 'name avatar usernae')
      .limit(15);

    const suggestedUsers = await getSuggestedUsers(req); // reuse logic
    // console.log(suggestedUsers)

    res.json({
      activities,
      suggestedUsers: suggestedUsers || []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};