// models/chapter.js
const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Chapter title is required']
  },
  // Each chapter belongs to one Course
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Courses',
    required: [true, 'Associated course is required']
  },
  // Chapters can have one or many videos
  videos: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Video'
  }]
}, { timestamps: true });

const Chapter = mongoose.model('Chapter', chapterSchema);
module.exports = Chapter;
