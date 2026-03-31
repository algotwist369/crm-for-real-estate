function notFound(req, res, next) {
    const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    err.statusCode = 404;
    next(err);
}

function normalizeMongooseError(err) {
    if (!err) return null;

    if (err.name === 'ValidationError') {
        const details = Object.values(err.errors || {}).map(e => ({
            path: e.path,
            message: e.message
        }));
        const message = details.length > 0 ? details[0].message : 'Validation error';
        return { statusCode: 400, message, details };
    }

    if (err.name === 'CastError') {
        return {
            statusCode: 400,
            message: `Invalid ${err.path}`,
            details: [{ path: err.path, message: err.message }]
        };
    }

    if (err.code === 11000) {
        const keys = err.keyValue ? Object.keys(err.keyValue) : [];
        const key = keys[0] || 'field';
        return { statusCode: 409, message: `Duplicate value for ${key}` };
    }

    return null;
}

function errorHandler(err, req, res, next) {
    const normalized = normalizeMongooseError(err);
    const statusCode = normalized?.statusCode || err?.statusCode || err?.status || 500;

    const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
    let message = normalized?.message || err?.message || 'Server error';

    // Enhance validation error messages
    const details = normalized?.details || err?.details;
    if (message === 'Validation error' && Array.isArray(details) && details.length > 0) {
        message = details[0].message;
    }

    // Always log 500-level errors to the terminal so the real cause is visible
    if (statusCode >= 500) {
        const errMsg = err?.message || String(err) || 'Unknown error';
        const errStack = err?.stack || `No stack. Type: ${typeof err}. Message: ${errMsg}`;
        console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl} - ${errMsg}`);
        console.error(errStack);
    }

    const payload = {
        success: false,
        message: statusCode >= 500 && isProd ? 'Internal server error' : message
    };

    if (details) payload.details = details;
    if (!isProd && err?.stack) payload.stack = err.stack;

    res.status(statusCode).json(payload);
}

function wrapAsync(handler) {
    return function wrapped(req, res, next) {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}

module.exports = {
    notFound,
    errorHandler,
    wrapAsync
};
