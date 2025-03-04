const express = require('express');
const featureController = require('../Controllers/features'); // Ensure the path is correct
const router = express.Router();

// Create a new feature
router.post('/create', featureController.createFeature);

// Get all features
router.get('/get-all', featureController.getAllFeatures);

// Get a single feature by ID
router.get('/:id', featureController.getFeatureById);

// Update a feature
router.put('/:id/update', featureController.updateFeature);

// Delete a feature
router.delete('/:id/delete', featureController.deleteFeature);

module.exports = router;
