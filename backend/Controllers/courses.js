const Courses = require('../Models/courses');
const express = require('express');
const asyncErrorWrapper = require('express-async-handler');

const createCourse = asyncErrorWrapper(async (req, res, next) => {
  try {
    const { name, price, category } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const imagePaths = req.files.map(file => file.path);
    const newCourse = await Courses.create({ name, price, category, images: imagePaths });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: newCourse
    });
  } catch (error) {
    next(error);
  }
});


const getAllCourses = asyncErrorWrapper(async (req, res, next) => {
  try {
      const excludedIds = ["67a5fd5cf376cb2608d8fa35", "67a5fb4ff376cb2608d8fa33"];
      // You might also want to populate chapters if needed:
      const courses = await Courses.find({ _id: { $nin: excludedIds } });
      res.status(200).json({
          success: true,
          data: courses
      });
  } catch (error) {
      next(error);
  }
});

const updateCourse = asyncErrorWrapper(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, price, category, replaceImages } = req.body; // `replaceImages` is optional
        const newImagePaths = req.files ? req.files.map(file => file.path) : [];
    
        const course = await Courses.findById(id);
        if (!course) {
          return res.status(404).json({ message: 'Course not found' });
        }
    
        // Update fields if provided
        course.name = name || course.name;
        course.price = price || course.price;
        course.category = category || course.category;
    
        if (replaceImages === 'true') {
          // Replace all existing images with new ones
          course.images = newImagePaths;
        } else if (newImagePaths.length > 0) {
          // Append new images to existing ones
          course.images = [...course.images, ...newImagePaths];
        }
    
        await course.save();
    
        res.status(200).json({
          message: 'Course successfully updated',
          data: course,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
});

const getCourseById = asyncErrorWrapper(async (req, res, next) => {
  const { id } = req.params;
  try {
      // If your Courses schema now includes chapters, populate them and their videos
      const course = await Courses.findById(id).populate({
          path: 'chapters',
          populate: { path: 'videos' }
      });
      if (!course) {
          return res.status(404).json({ message: 'Course not found' });
      }
      res.status(200).json({
          success: true,
          data: course
      });
  } catch (error) {
      next(error);
  }
});

module.exports = { createCourse, getAllCourses, getCourseById, updateCourse };
