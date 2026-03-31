const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('./middleware/sanitize');
const xss = require('./middleware/xss');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config(); 

const { notFound, errorHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes');
const logger = require('./utils/logger');

function createApp() {
    const app = express();

    // Security Headers
    app.use(helmet());

    // CORS configuration
    app.use(cors({
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : true,
        credentials: true
    }));

    // Rate Limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again after 15 minutes',
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api/', limiter);

    // Logging
    app.use(morgan(
        ':method :url :status :res[content-length] - :response-time ms',
        { stream: { write: (message) => logger.http(message.trim()) } }
    ));

    app.use(cookieParser());

    // Body parser with size limits
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ limit: '10mb', extended: true }));

    // Custom Data sanitization against NoSQL injection (Express 5 compatible)
    app.use(mongoSanitize);

    // Custom Data sanitization against XSS (Express 5 compatible)
    app.use(xss);

    // Compression
    app.use(compression());

    app.get('/health', (req, res) => res.status(200).json({ ok: true }));
    app.use('/api', apiRoutes);

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

module.exports = { createApp };

