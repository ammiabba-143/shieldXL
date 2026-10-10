"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_js_1 = require("../config/db.js");
const emailService_js_1 = require("../services/notifications/emailService.js");
const router = (0, express_1.Router)();
router.get('/', (_req, res) => {
    const dbStatus = (0, db_js_1.getDbStatus)();
    const emailStatus = emailService_js_1.emailService.getStatus();
    res.json({
        status: 'HEALTHY',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
            connected: dbStatus.connected,
            state: dbStatus.state,
            error: dbStatus.error,
        },
        notifications: {
            emailConfigured: emailStatus.isConfigured,
        },
        services: {
            metaAiSupported: true,
            grokSupported: true,
        },
    });
});
exports.default = router;
