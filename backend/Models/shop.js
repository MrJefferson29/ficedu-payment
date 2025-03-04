const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: false
  },
  name: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true, 
    min: [0, 'Price must be a positive number'] 
  },
  description: { 
    type: String, 
    required: false 
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
  }
}, { timestamps: true });

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
