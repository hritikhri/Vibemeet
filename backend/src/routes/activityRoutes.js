const express =require ('express');
const { protect }= require( '../middleware/auth.js');
const activityController= require( '../controllers/activityController.js');
const upload = require('../config/multer.js');

const router = express.Router();

router.get('/', protect, activityController.getAllActivities);
router.get('/explore', protect, activityController.exploreActivities);
router.get('/:id', protect, activityController.getActivityById);

router.post('/', protect, activityController.createActivity);
router.post('/:id/join', protect, activityController.requestJoin);
router.post('/:id/like', protect, activityController.likeActivity);
router.post('/:id/comment', protect, activityController.addComment);
router.post('/:id/messages', protect, activityController.addMessage);

// Group Chat Image Upload
router.post(
  '/:id/image',
  protect,
  upload.single('image'),
  activityController.uploadActivityImage
);

router.put('/:id', protect, activityController.updateActivity);
router.delete('/:id', protect, activityController.deleteActivity);

module.exports= router;