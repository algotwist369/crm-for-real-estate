const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { notFound, errorHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes');

function createApp() {
    const app = express();

    app.use(cors({
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : true,
        credentials: true
    }));
    app.use(cookieParser());

    app.use(express.json({ limit: '2mb' }));
    app.use(express.urlencoded({ extended: true }));

    app.get('/health', (req, res) => res.status(200).json({ ok: true }));
    app.use('/api', apiRoutes);

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

module.exports = { createApp };

