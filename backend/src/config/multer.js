// backend/src/config/multer.js
const multer = require( 'multer');

const storage = multer.memoryStorage(); // Store in memory for direct Cloudinary upload

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports =upload;