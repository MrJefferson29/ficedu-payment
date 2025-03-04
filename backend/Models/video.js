const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: "Courses"
    },
    chapter: {
        type: String,
        required: [true, 'Provide a valid chapter']
    },
    content: {
        type: String,
    },
    videos: [{
        file: [String],  // Array of files
        title: String,   // Title corresponding to each file
    }]
}, {timestamps: true});

const Video = mongoose.model('Video', videoSchema)

module.exports = Video;