// backend/routes/interest.routes.js
const express = require( 'express');
const { protect } = require('../middleware/auth.js');
const {
  addInterest,
  removeInterest,
  getInterestedUsers,
} = require('../controllers/interestController.js');

const router = express.Router();

// POST   /api/users/:id/interest   → express interest in a profile
// DELETE /api/users/:id/interest   → remove interest
// GET    /api/users/:id/interested → list who is interested in this profile

router.post('/:id/interest',   protect, addInterest);
router.delete('/:id/interest', protect, removeInterest);
router.get('/:id/interested',  protect, getInterestedUsers);

module.exports= router;                     