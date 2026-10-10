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
exports.AnalysisModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AnalysisSchema = new mongoose_1.Schema({
    owner: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalUrl: { type: String, trim: true },
    normalizedUrl: { type: String, trim: true },
    platform: { type: String, enum: ['META', 'X', 'UNSUPPORTED'], required: true, index: true },
    aiWebsite: { type: String, enum: ['META_AI', 'GROK'], required: true, index: true },
    inputSourceType: {
        type: String,
        enum: ['ORIGINAL_POST_URL', 'USER_UPLOAD', 'MANUAL_ENTRY'],
        default: 'ORIGINAL_POST_URL',
    },
    uploadedFilePath: { type: String },
    uploadedFileName: { type: String },
    mediaType: { type: String, enum: ['IMAGE', 'VIDEO', 'POST', 'UNKNOWN'], default: 'UNKNOWN' },
    jobStatus: {
        type: String,
        enum: [
            'PENDING',
            'VALIDATING_URL',
            'DETECTING_PLATFORM',
            'CHECKING_SESSION',
            'SUBMITTING_URL',
            'WAITING_FOR_AI_RESPONSE',
            'WAITING_FOR_USER',
            'ANALYZING',
            'COMPLETED',
            'INCONCLUSIVE',
            'FAILED',
            'UNABLE_TO_ANALYZE',
        ],
        default: 'PENDING',
        index: true,
    },
    resultCategory: {
        type: String,
        enum: [
            'POTENTIAL_MANIPULATION',
            'NO_STRONG_SIGNALS_DETECTED',
            'INCONCLUSIVE',
            'UNABLE_TO_ANALYZE',
            'ANALYSIS_FAILED',
        ],
        index: true,
    },
    actualAiResponse: { type: String },
    observations: { type: [String], default: [] },
    limitations: { type: [String], default: [] },
    isManipulatedProbability: { type: Number, default: null },
    browserWorkflowStatus: { type: String, default: 'Initialized' },
    analysisTimestamp: { type: Date },
    errorCode: { type: String },
    errorMessage: { type: String },
    requiresReview: { type: Boolean, default: false, index: true },
    retentionExpiry: { type: Date },
}, {
    timestamps: true,
});
AnalysisSchema.index({ createdAt: -1 });
exports.AnalysisModel = mongoose_1.default.models.Analysis || mongoose_1.default.model('Analysis', AnalysisSchema);
