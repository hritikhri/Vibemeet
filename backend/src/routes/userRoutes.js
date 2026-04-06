const express =require ('express');
const { protect }= require( '../middleware/auth.js');
const userController= require( '../controllers/userController.js');

const router = express.Router();

router.get('/me', protect, userController.getMe);
router.get('/:id', protect, userController.getUserById);
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.get('/suggested', protect, userController.getSuggestedUsers);
router.get('/:id/activities', protect,userController.getUserActivities);


router.post('/unfriend', protect, userController.unfriend);
router.post('/:id/friend-request', protect, userController.sendFriendRequest);
router.post('/friend-request/:id/accept', protect, userController.acceptFriendRequest);
router.post('/friend-request/:id/reject', protect, userController.rejectFriendRequest);


module.exports= router;