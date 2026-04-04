const User =require ('../models/User.js');
const Activity= require( '../models/Activity.js');
const { getSuggestedUsers }= require( './userController.js');

exports.getFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const activities = await Activity.find()
      .populate('creator', 'name avatar')
      .limit(15);

    const suggestedUsers = await getSuggestedUsers(req, { json: () => {} }); // reuse logic

    res.json({
      activities,
      suggestedUsers: suggestedUsers || []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};