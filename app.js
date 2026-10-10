"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const index_js_1 = require("./config/index.js");
const rateLimiter_js_1 = require("./middleware/rateLimiter.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const authRoutes_js_1 = __importDefault(require("./routes/authRoutes.js"));
const platformRoutes_js_1 = __importDefault(require("./routes/platformRoutes.js"));
const analysisRoutes_js_1 = __importDefault(require("./routes/analysisRoutes.js"));
const aiStatusRoutes_js_1 = __importDefault(require("./routes/aiStatusRoutes.js"));
const notificationRoutes_js_1 = __importDefault(require("./routes/notificationRoutes.js"));
const reviewRoutes_js_1 = __importDefault(require("./routes/reviewRoutes.js"));
const healthRoutes_js_1 = __importDefault(require("./routes/healthRoutes.js"));
exports.app = (0, express_1.default)();
// Security Middlewares
exports.app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Allow dev tools / Vite proxy
    crossOriginEmbedderPolicy: false,
}));
exports.app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl) or localhost
        if (!origin || origin.startsWith('http://localhost') || origin === index_js_1.config.clientOrigin) {
            callback(null, true);
        }
        else {
            callback(null, false);
        }
    },
    credentials: true,
}));
exports.app.use((0, cookie_parser_1.default)());
exports.app.use(express_1.default.json({ limit: '10mb' }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Apply rate limiter to /api
exports.app.use('/api', rateLimiter_js_1.apiRateLimiter);
// Register routes
exports.app.use('/api/auth', authRoutes_js_1.default);
exports.app.use('/api/platform', platformRoutes_js_1.default);
exports.app.use('/api/analysis', analysisRoutes_js_1.default);
exports.app.use('/api/ai/status', aiStatusRoutes_js_1.default);
exports.app.use('/api/notifications', notificationRoutes_js_1.default);
exports.app.use('/api/reviews', reviewRoutes_js_1.default);
exports.app.use('/api/health', healthRoutes_js_1.default);
// 404 handler
exports.app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint not found', code: 'NOT_FOUND' });
});
// Centralized error handler
exports.app.use(errorHandler_js_1.errorHandler);
