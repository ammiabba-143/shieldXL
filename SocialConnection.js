"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialConnectionModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SocialConnectionSchema = new mongoose_1.Schema({
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    provider: {
        type: String,
        enum: ['INSTAGRAM', 'X'],
        required: true,
    },
    providerUserId: {
        type: String,
        required: true,
    },
    providerUsername: {
        type: String,
        required: true,
    },
    profileData: {
        name: { type: String },
        avatarUrl: { type: String },
        profileUrl: { type: String },
    },
    scopes: {
        type: [String],
        default: [],
    },
    accessTokenEncrypted: {
        type: String,
        required: true,
    },
    refreshTokenEncrypted: {
        type: String,
    },
    tokenExpiresAt: {
        type: Date,
    },
    connectionStatus: {
        type: String,
        enum: ['CONNECTED', 'EXPIRED', 'REVOKED'],
        default: 'CONNECTED',
    },
}, {
    timestamps: true,
});
// Compound index to guarantee one connection per provider per user
SocialConnectionSchema.index({ owner: 1, provider: 1 }, { unique: true });
exports.SocialConnectionModel = mongoose_1.default.model('SocialConnection', SocialConnectionSchema);
