const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    subject: {
        type: String,
        enum: ['History', 'Physics', 'Literature', 'Geography', 'Computer Science', 'French', 'Biology', 'Chemistry']
    },
    year: {
        type: String,
    },
    file: {
        type: [String],
        validate: {
            validator: (value) => value.every(path => typeof path === 'string' && path.trim().length > 0),
            message: 'Each image path must be a non-empty string'
        },
    },
    category: {
        type: String,
        enum: ['question', 'answer'],
        default: 'question',
    },
}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
