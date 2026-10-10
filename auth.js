"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = require("../config/index.js");
const User_js_1 = require("../models/User.js");
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, index_js_1.config.jwtSecret, { expiresIn: '7d' });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, index_js_1.config.jwtSecret);
}
async function requireAuth(req, res, next) {
    try {
        let token;
        // Check header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        if (!token) {
            res.status(401).json({ error: 'Authentication required. Please log in.' });
            return;
        }
        const decoded = verifyToken(token);
        let user;
        const { isDbConnected } = await import('../config/db.js');
        if (isDbConnected()) {
            user = await User_js_1.UserModel.findById(decoded.userId).select('accountStatus role email name');
        }
        else {
            const { memoryStore } = await import('../models/memoryStore.js');
            user = memoryStore.users.get(decoded.userId);
        }
        if (!user || user.accountStatus !== 'ACTIVE') {
            res.status(401).json({ error: 'User account is inactive or not found.' });
            return;
        }
        req.user = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        };
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required.' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Access denied: Insufficient permissions.' });
            return;
        }
        next();
    };
}
async function optionalAuth(req, _res, next) {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, index_js_1.config.jwtSecret);
            req.user = decoded;
        }
    }
    catch {
        // Ignore invalid optional tokens
    }
    next();
}
