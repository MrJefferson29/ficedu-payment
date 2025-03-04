const express = require('express')
const mongoose = require('mongoose')
const User = require('../Models/user')
const asyncErrorWrapper = require('express-async-handler')

const profile = asyncErrorWrapper(async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
          .populate('referrals');  // Populate the referrals field
        res.json({ data: user });
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch user profile', error });
      }

});

const editProfile = asyncErrorWrapper(async (req, res, next) => {

    const {name, email, username, phone, orgemail, whatsapp, bio } = req.body

    const user = await User.findByIdAndUpdate(req.user.id, {
       name, email, username, phone, orgemail, whatsapp, bio,
        photo: req.savedUserPhoto
    },
        {
            new: true,
            runValidators: true
        })

    return res.status(200).json({
        success: true,
        data: user

    })

})

module.exports = {profile, editProfile}