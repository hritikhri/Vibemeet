const express =require ('express');
const { protect } =require ('../middleware/auth.js');
const feedController= require( '../controllers/feedController.js');

const router = express.Router();

router.get('/', protect, feedController.getFeed);

module.exports= router;