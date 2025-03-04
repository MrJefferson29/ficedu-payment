const express = require('express');
const asyncErrorWrapper = require('express-async-handler');
const Question = require('../Models/questions');

const addQuestion = async (req, res) => {
    try {
        const { subject, year, category } = req.body;
        const files = req.files.map(file => file.path); // Extract image paths

        // Save the new Question in the database
        const newQuestion = await Question.create({
            subject,
            year,
            category,
            file: files,
        });

        res.status(201).json({
            message: 'Question added successfully!',
            data: newQuestion,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const allQuestions = async (req, res) => {
    try {
      const { subject } = req.body;  // or req.query, depending on the request method
      console.log('Received subject:', subject);  // Log the received subject
      const questions = await Question.find({ subject });
      console.log('Questions found:', questions);  // Log the found questions
      res.status(200).json({ data: questions });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  
  const allSubjects = async (req, res) => {
    try {
      // Retrieve unique subjects from the questions collection
      const subjects = await Question.distinct('subject');  // The 'subject' field must exist in the model
      res.status(200).json({ data: subjects });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  // Fetch a single question by ID Controller
  const detailQuestion = async (req, res) => {
    try {
      const { id } = req.params;
      const question = await Question.findById(id); // Retrieve question by ID
  
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
  
      res.status(200).json({ data: question });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  

module.exports = { addQuestion, allQuestions, detailQuestion, allSubjects };
