const mongoose = require('mongoose');

const coursesSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    price: {
      type: String,
      required: true,
      min: [0, 'Price must be a positive number']
    },
    category: {
      type: String,
    },
    images: {
      type: [String],
      validate: {
        validator: (value) => value.every(path => typeof path === 'string' && path.trim().length > 0),
        message: 'Each image path must be a non-empty string'
      }
    },
    // Add chapters array to store Chapter references
    chapters: [{
      type: mongoose.Schema.ObjectId,
      ref: "Chapter"
    }],
  }, { timestamps: true });
  

const Courses = mongoose.model('Courses', coursesSchema);

module.exports = Courses;
