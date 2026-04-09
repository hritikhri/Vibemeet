const express= require('express');
const { body } =require( 'express-validator');
const authController =require( '../controllers/authController.js');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

router.post('/register', [
  body('name').notEmpty(),
  body('username').notEmpty().isLength({ min: 3 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], authController.register);

router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], authController.login);

router.post("/verify-otp",authController.verifyOtp)
router.post("/forgot-password",authController.forgotPassword)
router.post("/reset-password",authController.resetPassword)
router.post("/reset-password-with-current",authController.resetPasswordWithCurrent)

router.delete('/delete-account', protect, authController.deleteAccount);

router.post('/google', authController.googleLogin);

router.get('/me', protect,authController.getMe);

module.exports = router;