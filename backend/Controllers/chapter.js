// controllers/chapterController.js
const Chapter = require('../Models/chapter');
const asyncErrorWrapper = require('express-async-handler');
const Courses = require('../Models/courses')

// Create a new chapter
const createChapter = asyncErrorWrapper(async (req, res, next) => {
    const { courseId } = req.params; // Get course ID from URL
    const { title } = req.body;

    // Check if the course exists
    const course = await Courses.findById(courseId);
    if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
    }

    try {
        // Create chapter with the correct field name ("course")
        const newChapter = await Chapter.create({
            course: courseId,
            title,
        });

        // Add the new chapter reference to the course's chapters array
        await Courses.findByIdAndUpdate(courseId, { $push: { chapters: newChapter._id } });

        res.status(201).json({
            success: true,
            message: "Chapter created successfully",
            data: newChapter
        });
    } catch (error) {
        next(error);
    }
});

const getAllChapters = asyncErrorWrapper(async (req, res, next) => {
    const { courseId } = req.params;
    const chapters = await Chapter.find({ course: courseId }).populate('videos');
    res.status(200).json({
      success: true,
      data: chapters
    });
  });
  
// Get chapter by ID (optionally populate videos)
const getChapterById = asyncErrorWrapper(async (req, res, next) => {
  const { id } = req.params;
  const chapter = await Chapter.findById(id).populate('videos');
  if (!chapter) {
    return res.status(404).json({ success: false, message: 'Chapter not found' });
  }
  res.status(200).json({
    success: true,
    data: chapter
  });
});

// Update a chapter (e.g., updating title or videos array)
const updateChapter = asyncErrorWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { title } = req.body;
  
  const chapter = await Chapter.findById(id);
  if (!chapter) {
    return res.status(404).json({ success: false, message: 'Chapter not found' });
  }
  
  chapter.title = title || chapter.title;
  
  // You can also update videos if provided, e.g., replace or add videos
  // For example, if you pass an array of video IDs to replace the current videos:
  if(req.body.videos) {
    chapter.videos = req.body.videos;
  }
  
  await chapter.save();
  
  res.status(200).json({
    success: true,
    message: 'Chapter updated successfully',
    data: chapter,
  });
});

module.exports = { createChapter, getChapterById, updateChapter, getAllChapters };
