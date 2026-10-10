"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_js_1 = require("../config/logger.js");
function errorHandler(err, req, res, _next) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    logger_js_1.logger.error({
        err: {
            message: err.message,
            stack: err.stack,
            name: err.name,
        },
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
    }, 'Unhandled request error');
    res.status(status).json({
        error: message,
        code: err.code || 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
}
