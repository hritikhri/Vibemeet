const express = require('express');
const router = express.Router();
const { protect } =require ('../middleware/auth.js');
const chatController = require('../controllers/chatController.js');
const upload = require('../config/multer.js');

// Get private chat messages
router.get('/private/:userId', protect, chatController.getPrivateChat);
router.post('/private/:userId', protect, chatController.createMessage);
router.post('/private/:userId/image', protect, upload.single('image'),chatController.uploadPrivateImage);

module.exports = router;