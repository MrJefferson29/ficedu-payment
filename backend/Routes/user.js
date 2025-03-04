const express = require('express');
const {profile, editProfile} = require('../Controllers/user');
const authenticateUser = require('../Middleware/auth')

const router = express.Router();

router.post('/profile', authenticateUser, profile);
router.put('/edit-profile',authenticateUser, editProfile)

module.exports = router;