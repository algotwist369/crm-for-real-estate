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
        return { statusCode: 400, message: 'Validation error', details };
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
    const message = normalized?.message || err?.message || 'Server error';

    const payload = {
        success: false,
        message: statusCode >= 500 && isProd ? 'Internal server error' : message
    };

    if (normalized?.details) payload.details = normalized.details;
    if (!payload.details && Array.isArray(err?.details)) payload.details = err.details;
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
