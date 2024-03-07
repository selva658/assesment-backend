const jwt = require('jsonwebtoken');
const { promisify } = require('util');

// Middleware function for token authentication
const authenticateJWT = async (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Token is missing!' });
    }

    try {
        // Verify JWT token asynchronously
        const decoded = await promisify(jwt.verify)(token, process.env.SECRET_KEY);
        req.user = decoded; // Attach decoded user data to request object
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token is invalid!' });
    }
};

module.exports = {authenticateJWT};
