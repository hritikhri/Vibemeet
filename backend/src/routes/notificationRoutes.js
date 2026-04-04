const express =require( 'express');
const { protect } =require( '../middleware/auth.js');
const notificationController =require( '../controllers/notificationController.js');

const router = express.Router();

router.get('/', protect, notificationController.getNotifications);
router.put('/:id/read', protect, notificationController.markAsRead);
router.put('/read-all', protect, notificationController.markAllAsRead);

module.exports= router;