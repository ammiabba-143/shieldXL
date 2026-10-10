"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.apiRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const index_js_1 = require("../config/index.js");
exports.apiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: index_js_1.config.rateLimit.windowMs,
    max: index_js_1.config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many requests from this IP address. Please wait before submitting additional analyses.',
        code: 'RATE_LIMIT_EXCEEDED',
    },
});
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // max 20 login/register attempts per 15 min
    message: {
        error: 'Too many authentication attempts. Please try again later.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
});
