"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiStatusController = void 0;
const browserSessionManager_js_1 = require("../services/browserSessionManager.js");
const emailService_js_1 = require("../services/notifications/emailService.js");
class AiStatusController {
    /**
     * GET /api/ai/status - Fetch current health and session verification info for Meta AI & Grok
     */
    static async getStatus(_req, res) {
        try {
            const sessionManager = browserSessionManager_js_1.BrowserSessionManager.getInstance();
            const [metaStatus, grokStatus] = await Promise.all([
                sessionManager.checkSessionStatus('META_AI'),
                sessionManager.checkSessionStatus('GROK'),
            ]);
            const emailStatus = emailService_js_1.emailService.getStatus();
            res.json({
                services: {
                    metaAi: metaStatus,
                    grok: grokStatus,
                },
                notifications: {
                    emailConfigured: emailStatus.isConfigured,
                    host: emailStatus.host,
                },
                systemTime: new Date(),
            });
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Error checking AI status.' });
        }
    }
    /**
     * POST /api/ai/status/:service/initialize - Administrator initializes/probes browser session
     */
    static async initializeSession(req, res) {
        try {
            const rawService = (req.params.service || '').toUpperCase();
            const service = rawService === 'META' || rawService === 'META_AI' ? 'META_AI' : 'GROK';
            if (rawService !== 'META' && rawService !== 'META_AI' && rawService !== 'GROK') {
                res.status(400).json({ error: "Invalid service. Must be 'META_AI' or 'GROK'." });
                return;
            }
            const sessionManager = browserSessionManager_js_1.BrowserSessionManager.getInstance();
            const result = await sessionManager.initializeSession(service);
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Failed initializing browser session.' });
        }
    }
    /**
     * POST /api/ai/status/:service/verify - Administrator triggers live session verification
     */
    static async verifySession(req, res) {
        try {
            const rawService = (req.params.service || '').toUpperCase();
            const service = rawService === 'META' || rawService === 'META_AI' ? 'META_AI' : 'GROK';
            if (rawService !== 'META' && rawService !== 'META_AI' && rawService !== 'GROK') {
                res.status(400).json({ error: "Invalid service. Must be 'META_AI' or 'GROK'." });
                return;
            }
            const sessionManager = browserSessionManager_js_1.BrowserSessionManager.getInstance();
            const status = await sessionManager.checkSessionStatus(service);
            res.json({
                service,
                status,
                message: status.isAuthenticated
                    ? `${service} persistent session verified active.`
                    : `${service} session requires authentication.`,
            });
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Failed verifying browser session.' });
        }
    }
    /**
     * POST /api/ai/status/:service/reset - Administrator securely resets session profile cache
     */
    static async resetSession(req, res) {
        try {
            const rawService = (req.params.service || '').toUpperCase();
            const service = rawService === 'META' || rawService === 'META_AI' ? 'META_AI' : 'GROK';
            if (rawService !== 'META' && rawService !== 'META_AI' && rawService !== 'GROK') {
                res.status(400).json({ error: "Invalid service. Must be 'META_AI' or 'GROK'." });
                return;
            }
            const sessionManager = browserSessionManager_js_1.BrowserSessionManager.getInstance();
            const result = await sessionManager.resetSession(service);
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Failed resetting browser session.' });
        }
    }
    /**
     * POST /api/ai/status/:service/launch-login - Launches headed desktop browser window for manual login (localhost)
     */
    static async launchLogin(req, res) {
        try {
            const rawService = (req.params.service || '').toUpperCase();
            const service = rawService === 'META' || rawService === 'META_AI' ? 'META_AI' : 'GROK';
            if (rawService !== 'META' && rawService !== 'META_AI' && rawService !== 'GROK') {
                res.status(400).json({ error: "Invalid service. Must be 'META_AI' or 'GROK'." });
                return;
            }
            const sessionManager = browserSessionManager_js_1.BrowserSessionManager.getInstance();
            const result = await sessionManager.launchInteractiveLogin(service);
            res.json({ service, ...result });
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Failed launching browser login window.' });
        }
    }
    /**
     * POST /api/ai/status/:service/save-session - Saves interactive session storage state and verifies
     */
    static async saveSession(req, res) {
        try {
            const rawService = (req.params.service || '').toUpperCase();
            const service = rawService === 'META' || rawService === 'META_AI' ? 'META_AI' : 'GROK';
            if (rawService !== 'META' && rawService !== 'META_AI' && rawService !== 'GROK') {
                res.status(400).json({ error: "Invalid service. Must be 'META_AI' or 'GROK'." });
                return;
            }
            const sessionManager = browserSessionManager_js_1.BrowserSessionManager.getInstance();
            const result = await sessionManager.saveInteractiveLogin(service);
            res.json({ service, ...result });
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Failed saving browser session.' });
        }
    }
    /**
     * POST /api/ai/status/:service/cancel-login - Closes interactive window without saving
     */
    static async cancelLogin(req, res) {
        try {
            const rawService = (req.params.service || '').toUpperCase();
            const service = rawService === 'META' || rawService === 'META_AI' ? 'META_AI' : 'GROK';
            if (rawService !== 'META' && rawService !== 'META_AI' && rawService !== 'GROK') {
                res.status(400).json({ error: "Invalid service. Must be 'META_AI' or 'GROK'." });
                return;
            }
            const sessionManager = browserSessionManager_js_1.BrowserSessionManager.getInstance();
            const result = await sessionManager.cancelInteractiveLogin(service);
            res.json({ service, ...result });
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Failed closing browser window.' });
        }
    }
    /**
     * POST /api/ai/status/:service/import-session - Import cookies / storageState JSON for Cloud MVP Hosting
     */
    static async importSession(req, res) {
        try {
            const rawService = (req.params.service || '').toUpperCase();
            const service = rawService === 'META' || rawService === 'META_AI' ? 'META_AI' : 'GROK';
            if (rawService !== 'META' && rawService !== 'META_AI' && rawService !== 'GROK') {
                res.status(400).json({ error: "Invalid service. Must be 'META_AI' or 'GROK'." });
                return;
            }
            const { sessionData, rawData } = req.body;
            const dataToImport = sessionData || rawData;
            if (!dataToImport || typeof dataToImport !== 'string' || dataToImport.trim().length === 0) {
                res.status(400).json({ error: 'Please provide valid sessionData (storageState JSON or Cookie string).' });
                return;
            }
            const sessionManager = browserSessionManager_js_1.BrowserSessionManager.getInstance();
            const result = await sessionManager.importSessionState(service, dataToImport);
            if (!result.success) {
                res.status(400).json({ error: result.message });
                return;
            }
            res.json({ service, ...result });
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Failed importing session state.' });
        }
    }
    /**
     * GET /api/ai/status/:service/export-session - Export storageState JSON for transfer to Cloud MVP Hosting
     */
    static async exportSession(req, res) {
        try {
            const rawService = (req.params.service || '').toUpperCase();
            const service = rawService === 'META' || rawService === 'META_AI' ? 'META_AI' : 'GROK';
            if (rawService !== 'META' && rawService !== 'META_AI' && rawService !== 'GROK') {
                res.status(400).json({ error: "Invalid service. Must be 'META_AI' or 'GROK'." });
                return;
            }
            const sessionManager = browserSessionManager_js_1.BrowserSessionManager.getInstance();
            const result = await sessionManager.exportSessionState(service);
            if (!result.success) {
                res.status(404).json({ error: result.message });
                return;
            }
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Failed exporting session state.' });
        }
    }
}
exports.AiStatusController = AiStatusController;
