const express= require('express');
const { protect } =require ('../middleware/auth.js');

const router = express.Router(); 

// router.get('/explore', protect, exploreController.getExplore);


module.exports = router;