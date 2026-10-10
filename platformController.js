"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformController = void 0;
const zod_1 = require("zod");
const platformDetectionService_js_1 = require("../services/platformDetectionService.js");
const browserSessionManager_js_1 = require("../services/browserSessionManager.js");
const detectSchema = zod_1.z.object({
    url: zod_1.z.string().min(1, 'URL is required'),
});
class PlatformController {
    static async detect(req, res) {
        const parsed = detectSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const { url } = parsed.data;
        const result = platformDetectionService_js_1.PlatformDetectionService.detect(url);
        // Provide hint about session readiness without executing analysis
        let sessionStatus = 'UNKNOWN';
        if (result.selectedAiWebsite) {
            try {
                const session = await browserSessionManager_js_1.BrowserSessionManager.getInstance().checkSessionStatus(result.selectedAiWebsite);
                sessionStatus = session.isAuthenticated ? 'AUTHENTICATED' : 'REQUIRES_SETUP';
            }
            catch {
                sessionStatus = 'OFFLINE';
            }
        }
        res.json({
            ...result,
            sessionStatus,
        });
    }
}
exports.PlatformController = PlatformController;
