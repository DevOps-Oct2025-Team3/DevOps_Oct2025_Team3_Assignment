const rateLimit = require('express-rate-limit');

// Strict rate limiter for login endpoint (prevents brute force attacks)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: {
        message: "Too many login attempts from this IP, please try again after 15 minutes"
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Count all requests (both failed and successful)
    skipFailedRequests: false
});

// Rate limiter for user creation (prevents spam account creation)
const createUserLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 create requests per hour
    message: {
        message: "Too many accounts created from this IP, please try again after an hour"
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
});

// Rate limiter for user deletion (prevents abuse of delete operations)
const deleteUserLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 delete requests per 15 minutes
    message: {
        message: "Too many delete requests from this IP, please try again after 15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
});

// General API rate limiter (prevents DoS attacks)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per 15 minutes
    message: {
        message: "Too many requests from this IP, please try again later"
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
});

module.exports = {
    loginLimiter,
    createUserLimiter,
    deleteUserLimiter,
    apiLimiter
};
