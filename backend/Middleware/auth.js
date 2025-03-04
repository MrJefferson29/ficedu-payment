const jwt = require('jsonwebtoken');
const User = require('../Models/user');

const authenticateUser = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authorization token missing' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('JWT Verification Error:', error); // Debug log
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = authenticateUser;
