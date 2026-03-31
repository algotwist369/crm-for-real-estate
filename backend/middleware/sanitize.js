const logger = require('../utils/logger');

/**
 * Recursively removes any keys starting with '$' from an object.
 * This is used to prevent NoSQL injection attacks.
 */
function sanitize(obj) {
    if (obj instanceof Object) {
        for (const key in obj) {
            if (key.startsWith('$')) {
                logger.warn(`Sanitizing potential NoSQL injection key: ${key}`);
                delete obj[key];
            } else {
                sanitize(obj[key]);
            }
        }
    }
    return obj;
}

/**
 * Middleware to sanitize req.body, req.query, and req.params.
 * Designed to be compatible with Express 5 by not overwriting the property itself.
 */
const mongoSanitizeMiddleware = (req, res, next) => {
    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);
    next();
};

module.exports = mongoSanitizeMiddleware;
