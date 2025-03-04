const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Ai = require('../Models/Ai');  // Correct import for Ai model

// Initialize the AI model
const genAI = new GoogleGenerativeAI("AIzaSyAuPNbsajUF_42Cnm7lV351OZ2IhUsHveU");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Static data that you want to include in the prompt
const data = [
    "Bamessing village is one of four villages that make up Ndop central Central Sub Division, and one of thirteen villages of Ngoketunjia division of the North West region of Cameroon. Bamessing is located along the ring road from Bamenda, some 38 km from the town of Bamenda, on the Bamenda-Nkambe stretch of the ring road, just before Bamunka (Ndop town).",
    "Bamessing - Nsei is a traditional potter's village, with the pottery center of Prescraft, where traditional potters are encouraged to pursue their trade. In order to widen the product range, new techniques have been introduced, such as a potter's wheel, glazing, and wood kiln firing. Designers from Europe(Mission 21, Switzerland) help to develop new designs.",
    "Prescraft is committed to a sustainable environment. Prespot maintains a fuel plantation and also runs a reforestation program with the farmers in the area, funded by Mission 21, Switzerland.",
    "Bamessing village is a second class Fondom with respect to the administrative divisions in Cameroon. It is led by a traditional ruler whose decisions are guided by the Ngumba (secret society), and whose decisions are final. The traditional ruler is an auxiliary administrator. The government appoints divisional and sub-divisional service heads, whose duties are coordinated by the senior officer of Ngoketunjia division.",
    "There are several educational institutions, including government-owned, privately-owned, and denominational: embracing nursery, primary, secondary, and high schools.",
    "Bamessing village is a pottery center, where traditional crafts are made and sold throughout the North West region and the rest of Cameroon. You can spend the morning with a potter to make and keep your own creation and in the afternoon visit the workshop where the professionals work.",
    "The center consists of twenty-eight trained potters (piece workers); eight workers in tile and brick production (contracted laborers); five in clay production and reforestation (contracted laborers); ten seasonal workers in clay production and reforestation; six laborers in administration and organization; and thirty home producers (traditional pottery, basket weaving, raffia weaving).",
    "As a Fair Trade enterprise, which is also a member of the World Fair Trade Organisation (WFTO) and its regional chapter COFTA (Cooperation for Fair Trade in Africa), Prescraft follows the principles of the Fair Trade movement.",
    "Prescraft produces all its articles in its own centers, or with home producers. They guarantee their producers a fair income and promote the crafts industry in the grasslands of Cameroon. At present, more than 150 men and women directly benefit from their activities.",
    "Prescraft is a development project of the Presbyterian Church (PCC) in Cameroon. The PCC has a deep understanding of the Christian faith through the proclamation of the gospel. This is expressed by many forms of activities of church life in the congregations and institutions in the fields of theology, development, health, education and charity work for society."
];

// Generate content function
const generateContent = async (req, res) => {
    try {
        const prompt = `Your name is PAC AI and you are a culture AI trained on the data joint ${data.join(" ")}, now give me acurate responses to this. ${req.body.prompt}` || `Hi there, please study this information: ${data.join(" ")}`; // Use static data in the prompt
        // console.log("Prompt:", prompt);

        // Generate the content using the AI model
        const result = await model.generateContent(prompt);
        // console.log("Full AI Response:", result);

        // Call the 'text' function to get the generated text
        const generatedText = await result.response.text();

        if (generatedText) {
            // Save the prompt and response in the database
            const newAiEntry = new Ai({
                prompt: prompt,
                response: generatedText,
            });

            await newAiEntry.save();  // Save to the database

            // Send the AI-generated content back to the client
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
