const express = require('express');
const os = require('os');
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
    const allowedOrigins = process.env.CORS_ORIGIN 
        ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) 
        : (process.env.NODE_ENV === 'production' ? [] : ['https://real-crm-two.vercel.app', 'http://localhost:5173']);

    app.use(cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl)
            if (!origin) return callback(null, true);
            
            if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true
    }));

    // Rate Limiting
    const apiLimiter = rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 1000, 
        message: 'Too many requests from this IP, please try again after 5 minutes',
        standardHeaders: true,
        legacyHeaders: false,
    });
    
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 20, 
        message: 'Too many login attempts from this IP, please try again after 15 minutes',
        standardHeaders: true,
        legacyHeaders: false,
    });
    
    // Aggressive limiter to specifically stop frontend React loops from crashing the Whatsapp worker
    const whatsappLimiter = rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 2, 
        message: { success: false, message: 'Please wait a minute before requesting another QR code.' },
        standardHeaders: true,
        legacyHeaders: false,
    });

    app.use('/api/', apiLimiter);
    app.use('/api/auth/', authLimiter);
    app.use('/api/campaigns/whatsapp/init', whatsappLimiter);
    app.use('/api/campaigns/whatsapp/regenerate', whatsappLimiter);

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

    app.get('/health', (req, res) => {
        const memUsage = process.memoryUsage();
        res.status(200).json({ 
            ok: true,
            uptime: process.uptime(),
            memory: {
                rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
                heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
                heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`,
            },
            cpu: {
                loadAvg: os.loadavg(),
                cores: os.cpus().length,
            }
        });
    });
    app.use('/api', apiRoutes);

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

module.exports = { createApp };

