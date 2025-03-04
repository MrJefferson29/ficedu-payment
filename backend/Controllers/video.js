const express = require('express');
const Video = require('../Models/video');
const asyncErrorWrapper = require('express-async-handler');
const Courses = require('../Models/courses');

const addVideo = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { chapter, content, title } = req.body;
        const filePath = req.file ? req.file.path : null; // Extract single file path
        const { id } = req.params; // Extract course ID

        if (!filePath) {
            return res.status(400).json({ success: false, message: "No video file uploaded" });
        }

        // Find the course
        const course = await Courses.findById(id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Check if a video object already exists for this course and chapter
        let video = await Video.findOne({ course: id, chapter });

        if (video) {
            // If video object exists, append new video to the videos array
            video.videos.push({ file: filePath, title });
        } else {
            // Otherwise, create a new video entry
            video = await Video.create({ 
                course: course._id, 
                chapter, 
                content, 
                videos: [{ file: filePath, title }]
            });

            // Push the new video ID into the course's vids array
            course.vids.push(video._id);
            await course.save();
        }

        await video.save();

        return res.status(201).json({
            success: true,
            data: video,
        });
    } catch (error) {
        next(error);
    }
});

const getVideosByCourse = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { courseId } = req.params;

        // Fetch videos and structure response
        const videos = await Video.find({ course: courseId }).select('chapter content videos');

        if (!videos.length) {
            return res.status(404).json({
                success: false,
                message: "No videos found for this course",
            });
        }

        res.status(200).json({
            success: true,
            data: videos,
        });
    } catch (error) {
        next(error);
    }
});

const getVideoDetails = asyncErrorWrapper(async (req, res, next) => {
    const { id } = req.params;  // Get video ID from the URL parameters
    try {
        const video = await Video.findById(id).populate('course');  // Populate course if you want course info too
        if (!video) {
            return res.status(404).json({ success: false, message: 'Video not found' });
        }
        res.status(200).json({
            success: true,
            data: video,
        });
    } catch (error) {
        next(error);
    }
});

const updateVideo = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { id } = req.params;
        const filePath = req.file ? req.file.path : null;
        const { title } = req.body;

        if (!filePath) {
            return res.status(400).json({ success: false, message: "No video file uploaded" });
        }

        // Find the video object
        const video = await Video.findById(id);
        if (!video) {
            return res.status(404).json({ success: false, message: 'Video not found' });
        }

        // Add the new file & title to the videos array
        video.videos.push({ file: filePath, title });

        // Save the updated video object
        await video.save();

        return res.status(200).json({
            success: true,
            data: video,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = { addVideo, getVideosByCourse, getVideoDetails, updateVideo };
