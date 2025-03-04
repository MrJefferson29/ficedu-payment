const express = require('express');
const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'provide a title'],
    },
    notes: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: false,
    },
    files: [String]
}, {timestamps: true});

const Feature = mongoose.model('Feature', featureSchema)

module.exports = Feature;