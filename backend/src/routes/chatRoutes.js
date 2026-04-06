const express = require('express');
const router = express.Router();
const { protect } =require ('../middleware/auth.js');
const chatController = require('../controllers/chatController.js');

// Get private chat messages
router.get('/private/:userId', protect, chatController.getPrivateChat);
router.post('/private/:userId', protect, chatController.createMessage);

module.exports = router;