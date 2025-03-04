const { createCourse, getAllCourses, updateCourse, getCourseById } = require('../Controllers/courses');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');
const express = require('express');

const router = express.Router();

// Cloudinary Storage Configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'courses', // Folder in Cloudinary
    format: async (req, file) => 'png', // Convert all uploads to PNG
    public_id: (req, file) => `${file.fieldname}-${Date.now()}`
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

router.post('/create', upload.array('images', 5), createCourse);
router.post('/get-all', getAllCourses);
router.get('/:id', getCourseById);
router.put('/:id/update', upload.array('images', 5), updateCourse);

module.exports = router;
