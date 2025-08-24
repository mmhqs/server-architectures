const jwt = require('jsonwebtoken');
const config = require('../config/database');

/**
 * Middleware for authenticating requests using JSON Web Tokens (JWT).
 *
 * This middleware checks for the presence and validity of an access token
 * in a request's 'Authorization' header. If the token is valid,
 * it decodes the user data and attaches it to the request object (req.user),
 * allowing subsequent routes to access the authenticated user's information.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The callback function to pass control to the next middleware.
 * @returns {void} It doesn't return anything but can send an HTTP response and terminate the cycle.
 */
const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            message: 'Required access token, my friend.' 
        });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid token :(' 
        });
    }
};

module.exports = { authMiddleware };