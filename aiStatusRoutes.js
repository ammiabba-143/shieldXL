"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiStatusController_js_1 = require("../controllers/aiStatusController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.get('/', aiStatusController_js_1.AiStatusController.getStatus);
// Admin-only session management routes
router.post('/:service/initialize', auth_js_1.requireAuth, (0, auth_js_1.requireRole)('ADMIN'), aiStatusController_js_1.AiStatusController.initializeSession);
router.post('/:service/verify', auth_js_1.requireAuth, (0, auth_js_1.requireRole)('ADMIN'), aiStatusController_js_1.AiStatusController.verifySession);
router.post('/:service/reset', auth_js_1.requireAuth, (0, auth_js_1.requireRole)('ADMIN'), aiStatusController_js_1.AiStatusController.resetSession);
router.post('/:service/launch-login', auth_js_1.requireAuth, (0, auth_js_1.requireRole)('ADMIN'), aiStatusController_js_1.AiStatusController.launchLogin);
router.post('/:service/save-session', auth_js_1.requireAuth, (0, auth_js_1.requireRole)('ADMIN'), aiStatusController_js_1.AiStatusController.saveSession);
router.post('/:service/cancel-login', auth_js_1.requireAuth, (0, auth_js_1.requireRole)('ADMIN'), aiStatusController_js_1.AiStatusController.cancelLogin);
router.post('/:service/import-session', auth_js_1.requireAuth, (0, auth_js_1.requireRole)('ADMIN'), aiStatusController_js_1.AiStatusController.importSession);
router.get('/:service/export-session', auth_js_1.requireAuth, (0, auth_js_1.requireRole)('ADMIN'), aiStatusController_js_1.AiStatusController.exportSession);
exports.default = router;
