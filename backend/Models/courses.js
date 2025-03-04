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
    vids: [{
        type: mongoose.Schema.ObjectId,
        ref: "Video"
    }],
}, { timestamps: true });

const Courses = mongoose.model('Courses', coursesSchema);

module.exports = Courses;
