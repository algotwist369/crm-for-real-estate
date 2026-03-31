const { filterXSS } = require('xss');

/**
 * Recursively sanitizes string values in an object to prevent XSS attacks.
 */
function sanitizeXSS(obj) {
    if (obj instanceof Object) {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = filterXSS(obj[key]);
            } else if (obj[key] instanceof Object) {
                sanitizeXSS(obj[key]);
            }
        }
    }
    return obj;
}

/**
 * Middleware to sanitize req.body, req.query, and req.params for XSS.
 * Designed to be compatible with Express 5 by not overwriting the property itself.
 */
const xssSanitizeMiddleware = (req, res, next) => {
    if (req.body) sanitizeXSS(req.body);
    if (req.query) sanitizeXSS(req.query);
    if (req.params) sanitizeXSS(req.params);
    next();
};

module.exports = xssSanitizeMiddleware;
