const express = require('express');
const mongoose = require('mongoose');
const User = require('../Models/user');
const asyncErrorWrapper = require('express-async-handler');

// Profile handler
const profile = asyncErrorWrapper(async (req, res) => {
    const user = await User.findById(req.user.id).populate('referrals'); // Populating referrals
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.json({ data: user });
});

// Edit profile handler
const editProfile = asyncErrorWrapper(async (req, res) => {
    const { name, email, username, phone, orgemail, whatsapp, bio } = req.body;

    const updatedData = {
        name,
        email,
        username,
        phone,
        orgemail,
        whatsapp,
        bio,
        photo: req.savedUserPhoto, // Ensure that this is set correctly somewhere
    };

    const user = await User.findByIdAndUpdate(req.user.id, updatedData, {
        new: true,
        runValidators: true,
    });

    if (!user) {
        return res.status(404).json({ message: 'User not found or update failed' });
    }

    return res.status(200).json({
        success: true,
        data: user,
    });
});

module.exports = { profile, editProfile };
