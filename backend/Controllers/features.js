const Feature = require('../Models/features');
const cloudinary = require('../Routes/cloudinary'); // Ensure Cloudinary is configured
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary storage for images/videos
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: 'features',
    resource_type: file.mimetype.startsWith('image/') ? 'image' : 'video',
    format: file.mimetype.split('/')[1],
    public_id: `${file.fieldname}-${Date.now()}`
  }),
});

const upload = multer({ storage: storage });

// Create a new feature with file upload
exports.createFeature = async (req, res) => {
  upload.array('files', 10)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const { title, notes, category } = req.body;
      const files = req.files.map(file => file.path); // Get Cloudinary file URLs

      const feature = new Feature({
        title,
        notes,
        category,
        files, // Store Cloudinary URLs
      });

      const savedFeature = await feature.save();
      res.status(201).json({ message: 'Feature created successfully', feature: savedFeature });
    } catch (error) {
      res.status(500).json({ message: 'Error creating feature', error: error.message });
    }
  });
};

// Get all features
exports.getAllFeatures = async (req, res) => {
  try {
    const features = await Feature.find();
    res.status(200).json(features);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching features', error: error.message });
  }
};

// Get a single feature by ID
exports.getFeatureById = async (req, res) => {
  try {
    const feature = await Feature.findById(req.params.id);
    if (!feature) return res.status(404).json({ message: 'Feature not found' });

    res.status(200).json(feature);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feature', error: error.message });
  }
};

// Update a feature
exports.updateFeature = async (req, res) => {
  try {
    const updatedFeature = await Feature.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ message: 'Feature updated successfully', feature: updatedFeature });
  } catch (error) {
    res.status(500).json({ message: 'Error updating feature', error: error.message });
  }
};

// Delete a feature
exports.deleteFeature = async (req, res) => {
  try {
    await Feature.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Feature deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting feature', error: error.message });
  }
};
