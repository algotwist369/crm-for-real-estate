const Joi = require('joi');
const { httpError } = require('../utils/common');

const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(
            {
                body: req.body,
                query: req.query,
                params: req.params,
            },
            {
                abortEarly: false,
                allowUnknown: true,
                stripUnknown: true,
            }
        );

        if (error) {
            const details = error.details.map((detail) => {
                let message = detail.message.replace(/['"]/g, '');
                
                // Remove 'body.' prefix if present
                if (message.startsWith('body.')) {
                    message = message.substring(5);
                }

                // Make the message more user-friendly
                // Example: "name is required" instead of "name is not allowed to be empty"
                message = message.charAt(0).toUpperCase() + message.slice(1);
                
                // Specific replacements for common Joi errors
                message = message.replace(/is not allowed to be empty/g, 'is required');
                message = message.replace(/must be a valid email/g, 'must be a valid email address');
                message = message.replace(/length must be at least (\d+) characters long/g, 'must be at least $1 characters');
                message = message.replace(/length must be less than or equal to (\d+) characters long/g, 'must be at most $1 characters');
                message = message.replace(/must be a number/g, 'must be a numeric value');
                message = message.replace(/is required/g, 'is a required field');

                return {
                    path: detail.path.join('.'),
                    message: message,
                };
            });
            // Show the first specific error message instead of generic "Validation error"
            const message = details.length > 0 ? details[0].message : 'Validation error';
            return next(httpError(400, message, details));
        }

        // Replace req data with validated and stripped data while maintaining object references for Express 5 compatibility
        if (value.body) {
            req.body = value.body;
        }
        if (value.query) {
            // Clear and re-populate req.query to avoid "only a getter" errors in Express 5
            for (const key in req.query) {
                delete req.query[key];
            }
            Object.assign(req.query, value.query);
        }
        if (value.params) {
            // Clear and re-populate req.params
            for (const key in req.params) {
                delete req.params[key];
            }
            Object.assign(req.params, value.params);
        }

        next();
    };
};

module.exports = validateRequest;
