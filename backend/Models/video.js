const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required']
  },
  description: {
    type: String,
    required: [true, 'Video description is required']
  },
  chapter: {
    type: mongoose.Schema.ObjectId,
    ref: 'Chapter',
    required: [true, 'Associated Chapter is required']
  },
  videoUrl: {
    type: String,
    required: true
  },
  public_id: {  // Storing Cloudinary's public_id helps with deletion
    type: String,
    required: true
  },
  duration: {  // Optional: Useful for displaying video length
    type: Number
  }
}, { timestamps: true });

const Video = mongoose.model('Video', videoSchema);
module.exports = Video;
