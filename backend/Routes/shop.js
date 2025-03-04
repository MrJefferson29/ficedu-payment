const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');
const path = require('path');
const { addItem, getAllItems, getItemById, updateItem, deleteItem } = require('../Controllers/shop');
const authenticateUser = require('../Middleware/auth');

const router = express.Router();

// Cloudinary Storage Configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'shop-items', // Folder in Cloudinary
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

// Route for adding an item
router.post('/add', authenticateUser, upload.array('images', 5), addItem);

// Route for getting all items
router.get('/get-all', getAllItems);

// Route for getting a single item by ID
router.get('/:id', getItemById);

// Route to update the item
router.put('/:id/update', upload.array('images', 5), updateItem);

// Route for deleting an item by ID
router.delete('/:id', deleteItem);

module.exports = router;