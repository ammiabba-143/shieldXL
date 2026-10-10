"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const index_js_1 = require("../config/index.js");
// Ensure upload directory exists
if (!fs_1.default.existsSync(index_js_1.config.uploads.dir)) {
    fs_1.default.mkdirSync(index_js_1.config.uploads.dir, { recursive: true });
}
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
]);
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, index_js_1.config.uploads.dir);
    },
    filename: (_req, file, cb) => {
        // Generate safe UUID filename preventing path traversal
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        const safeName = `${(0, uuid_1.v4)()}${ext}`;
        cb(null, safeName);
    },
});
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: index_js_1.config.uploads.maxSizeMb * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WEBP, MP4, WEBM, MOV.`));
        }
    },
});
