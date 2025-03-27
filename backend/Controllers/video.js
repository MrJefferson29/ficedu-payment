const Video = require('../Models/video');
const Chapter = require('../Models/chapter');
const asyncErrorWrapper = require('express-async-handler');
const cloudinary = require('../Routes/cloudinary');
const fs = require('fs');

// Allowed video formats
const allowedFormats = ['video/mp4', 'video/avi', 'video/quicktime'];

// Create a new video and associate it with a chapter
const createVideo = asyncErrorWrapper(async (req, res, next) => {
  console.log('req.files:', req.files);
  const { title, description } = req.body;
  const { chapterId } = req.params; // Now using chapterId

  // Check if file is uploaded
  if (!req.files || !req.files.video) {
      return res.status(400).json({ success: false, message: 'No video file uploaded' });
  }

  const videoFile = req.files.video;

  // Validate file MIME type
  if (!allowedFormats.includes(videoFile.mimetype)) {
      return res.status(400).json({ success: false, message: 'Invalid video format' });
  }

  // Validate that the chapter exists, since the Video model requires it
  if (!chapterId) {
      return res.status(400).json({ success: false, message: 'Chapter ID is required' });
  }
  const chapter = await Chapter.findById(chapterId);
  if (!chapter) {
      return res.status(404).json({ success: false, message: 'Chapter not found' });
  }

  try {
      // Upload video to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(videoFile.tempFilePath, {
          resource_type: 'video',
          folder: 'videos',
          public_id: `video_${Date.now()}`
      });

      // Remove the temporary file after upload
      fs.unlinkSync(videoFile.tempFilePath);

      // Create a new video document with the valid chapter reference
      const newVideo = await Video.create({
          title,
          description,
          videoUrl: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          chapter: chapterId  // Use the chapterId parameter
      });

      // Associate the video with the chapter
      chapter.videos.push(newVideo._id);
      await chapter.save();

      res.status(201).json({ success: true, message: "Video uploaded successfully", data: newVideo });
  } catch (error) {
      res.status(500).json({ success: false, message: 'Error uploading video', error: error.message });
  }
});

// Get all videos
const getAllVideos = asyncErrorWrapper(async (req, res, next) => {
    try {
        const videos = await Video.find();
        res.status(200).json({ success: true, data: videos });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching videos', error: error.message });
    }
});

// Get a single video by ID
const getVideoById = asyncErrorWrapper(async (req, res, next) => {
    const { id } = req.params;
    const video = await Video.findById(id);
    if (!video) {
        return res.status(404).json({ success: false, message: 'Video not found' });
    }
    res.status(200).json({ success: true, data: video });
});

// Update a video
const updateVideo = asyncErrorWrapper(async (req, res, next) => {
    const { id } = req.params;
    const { title, description } = req.body;

    const video = await Video.findById(id);
    if (!video) {
        return res.status(404).json({ success: false, message: 'Video not found' });
    }

    video.title = title || video.title;
    video.description = description || video.description;

    await video.save();
    res.status(200).json({ success: true, message: 'Video updated successfully', data: video });
});

// Delete a video (from Cloudinary & DB)
const deleteVideo = asyncErrorWrapper(async (req, res, next) => {
    const { id } = req.params;

    const video = await Video.findById(id);
    if (!video) {
        return res.status(404).json({ success: false, message: 'Video not found' });
    }

    try {
        // Delete the video from Cloudinary
        await cloudinary.uploader.destroy(video.public_id);

        // Remove the video document from the database
        await video.deleteOne();

        res.status(200).json({ success: true, message: 'Video deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting video', error: error.message });
    }
});

module.exports = { createVideo, getAllVideos, getVideoById, updateVideo, deleteVideo };
