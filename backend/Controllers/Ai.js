const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Ai = require("../Models/Ai");

// Initialize the AI model
const genAI = new GoogleGenerativeAI("AIzaSyAuPNbsajUF_42Cnm7lV351OZ2IhUsHveU");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const generateContent = async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const result = await model.generateContent(prompt);
    const generatedText = await result.response.text();

    if (generatedText) {
      const newAiEntry = new Ai({
        prompt: prompt,
        response: generatedText,
      });

      await newAiEntry.save();
      // Return the generated text using a consistent key "text"
      res.json({ text: generatedText });
    } else {
      res.status(500).json({ error: "AI response is empty" });
    }
  } catch (error) {
    console.error("Error generating AI content:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
};

module.exports = { generateContent };
