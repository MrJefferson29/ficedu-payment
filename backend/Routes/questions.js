const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');
const path = require('path');
const { addQuestion, allQuestions, detailQuestion, allSubjects } = require('../Controllers/questions');

const router = express.Router();

// Configure Cloudinary Storage for Documents
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'questions', // Folder in Cloudinary
        resource_type: 'raw', // Allow any file type
        public_id: (req, file) => `${Date.now()}-${file.originalname}`
    }
});

// File Filter to Accept Only Specific Document Types
const fileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|docx|xlsx|txt/; // Allowed file formats
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true); // Accept the file
    } else {
        return cb(new Error('Only PDF, DOCX, XLSX, and TXT files are allowed!'), false); // Reject the file
    }
};

const upload = multer({
    storage,
    fileFilter,
});

// Route for Adding Questions with Document File Upload
router.post('/add', upload.array('files', 10), addQuestion); // Accept up to 10 files
router.post('/get-all', allQuestions);
router.get('/get-subjects', allSubjects);
router.post('/:id/detail', detailQuestion);

module.exports = router;
