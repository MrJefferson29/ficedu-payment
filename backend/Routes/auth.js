const express = require('express');
const { Register, Login } = require('../Controllers/auth');
const authenticateUser = require('../Middleware/auth')

const router = express.Router();

// Public routes
router.post('/register', Register);
router.post('/login', Login);

// Example of a protected route that requires authentication
router.get('/profile',  (req, res) => {
    res.status(200).json({ success: true, user: req.user });
});

module.exports = router;
