"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const platformController_js_1 = require("../controllers/platformController.js");
const router = (0, express_1.Router)();
router.post('/detect', platformController_js_1.PlatformController.detect);
exports.default = router;
