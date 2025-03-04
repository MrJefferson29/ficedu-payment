const express = require('express');
const { addVideo, getVideosByCourse, getVideoDetails, updateVideo } = require('../Controllers/video'); // Import the controller
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary'); // Import Cloudinary config
const path = require('path');

const router = express.Router();

// Cloudinary Storage Configuration for Videos
const videoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'course-videos', // Folder in Cloudinary
        resource_type: 'video',  // Specify that the file is a video
        format: async (req, file) => 'mp4', // Convert videos to MP4 format
        public_id: (req, file) => `video-${Date.now()}-${Math.round(Math.random() * 1E9)}` // Unique public ID for the video
    }
});

// Multer setup with Cloudinary storage
const upload = multer({
    storage: videoStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB file size limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed!'), false);
        }
    }
});

// Route to upload a video for a specific course
router.post('/:id/video', upload.single('file'), addVideo);  // Accepts only 1 video file
router.get('/get-all/:courseId', getVideosByCourse);
router.get('/details/:id', getVideoDetails);
router.put('/edit/:id', upload.single('file'), updateVideo);

module.exports = router;
