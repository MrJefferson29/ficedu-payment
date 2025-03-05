const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin']
    },
    name: {
        type: String,
        required: [true, 'provide your Full Name']
    },
    username: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        required: [true, 'Provide a valid phone number']
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    orgemail: {
        type: String,
        required: true,
        default: 'Input organizational email here'
    },
    whatsapp: {
        type: String,
        required: true,
        default: 'Whatsapp contact(Optional)'
    },
    bio: {
        type: String,
        required: true,
        default: 'Write a short story about yourself'
    },
    password: {
        type: String,
        required: true,
    },
    paid: {
        type: Boolean,
        default: false,
    },
    referralCode: { type: String, unique: true },
    referredBy: { type: String, default: null },
    referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // 🔥 Transaction Fields
    mchTransactionRef: { type: String, unique: true, sparse: true }, // Store Tranzak transaction reference
    transactionId: { type: String, default: null }, // Store Tranzak transaction ID
    amountPaid: { type: Number, default: 0 }, // Store amount paid
    transactionStatus: { type: String, default: "PENDING" } // Track payment status

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
