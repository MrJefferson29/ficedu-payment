const express = require('express');
const asyncErrorWrapper = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../Models/user');

// Register a new user
const Register = asyncErrorWrapper(async (req, res, next) => {
    const { name, username, email, password, phone, referralCode } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ success: false, message: "Email already exists" });
    }

    // Generate unique referral code
    const generateReferralCode = () => {
        return Math.random().toString(36).substr(2, 8).toUpperCase();
    };
    const newReferralCode = generateReferralCode();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check if referral code exists
    let referredBy = null;
    if (referralCode) {
        const referrer = await User.findOne({ referralCode });
        if (!referrer) {
            return res.status(400).json({ success: false, message: "Invalid referral code" });
        }
        referredBy = referralCode;

        // Create the new user
        const newUser = await User.create({
            name,
            username,
            email,
            phone,
            password: hashedPassword,
            referralCode: newReferralCode,
            referredBy,
        });

        // Add the new user to the referrer's referrals list
        referrer.referrals.push(newUser._id);
        await referrer.save();

        // Respond with the new user data
        res.status(201).json({
            success: true,
            data: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                referralCode: newUser.referralCode,
            },
        });
    } else {
        // Create the new user without a referral code
        const newUser = await User.create({
            name,
            username,
            email,
            phone,
            password: hashedPassword,
            referralCode: newReferralCode,
        });

        // Respond with the new user data
        res.status(201).json({
            success: true,
            data: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                referralCode: newUser.referralCode,
            },
        });
    }
});

// Login a user
const Login = asyncErrorWrapper(async (req, res, next) => {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).json({ success: false, message: "User Not Found" });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid password" });
    }

    // Generate a JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
        expiresIn: '10d', // Token expires in 10 day
    });

    // Respond with the token
    res.status(200).json({
        success: true,
        token,
        data: {
            id: user._id,
            username: user.username,
            email: user.email,
        },
    });
});

module.exports = { Register, Login };
