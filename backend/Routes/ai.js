// routes/ai.js
const express = require("express");
const router = express.Router();
const { generateContent } = require("../Controllers/Ai");

router.post("/generate", generateContent);

module.exports = router;
