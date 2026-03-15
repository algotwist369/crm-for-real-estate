const User = require('../model/user.model');
const Agent = require('../model/agent.model');
const { verifyToken } = require('../utils/generateToken');
const { httpError, extractBearerToken, ensureNotBlacklisted } = require('../utils/common');

function runMiddleware(middleware, req, res) {
    return new Promise((resolve, reject) => {
        middleware(req, res, err => {
            if (err) return reject(err);
            resolve();
        });
    });
}

async function authenticate(req, res, next) {
    try {
        if (req.auth?.user && req.auth?.payload && req.auth?.token) return next();

        const token = extractBearerToken(req);
        if (!token) throw httpError(401, 'Authorization token required');
        await ensureNotBlacklisted(token);

        let payload;
        try {
            payload = verifyToken(token);
        } catch {
            throw httpError(401, 'Invalid or expired token');
        }

        if (!payload?.sub || !payload?.role) throw httpError(401, 'Invalid token');

        const user = await User.findOne({
            _id: payload.sub,
            is_active: true,
            is_deleted: false
        });
        if (!user) throw httpError(401, 'Invalid or expired token');

        req.auth = { token, payload, user };
        next();
    } catch (e) {
        next(e);
    }
}

function requireRoles(roles) {
    const allowed = Array.isArray(roles) ? roles : [];
    return async function requireRolesMiddleware(req, res, next) {
        try {
            await runMiddleware(authenticate, req, res);
            if (allowed.length && !allowed.includes(req.auth?.payload?.role)) {
                throw httpError(403, 'Forbidden');
            }
            next();
        } catch (e) {
            next(e);
        }
    };
}

function requireAdmin(req, res, next) {
    return requireRoles(['admin', 'super_admin'])(req, res, next);
}

async function requireAgent(req, res, next) {
    try {
        await runMiddleware(requireRoles(['agent']), req, res);
        if (req.auth?.agent) return next();

        const agent = await Agent.findOne({
            agent_details: req.auth.user._id,
            is_active: true
        });
        if (!agent) throw httpError(403, 'Agent profile not found or inactive');

        req.auth.agent = agent;
        next();
    } catch (e) {
        next(e);
    }
}

module.exports = {
    authenticate,
    requireRoles,
    requireAdmin,
    requireAgent
};
