"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisController = void 0;
const zod_1 = require("zod");
const Analysis_js_1 = require("../models/Analysis.js");
const analysisOrchestrator_js_1 = require("../services/analysisOrchestrator.js");
const responseInterpreter_js_1 = require("../services/ai/responseInterpreter.js");
const db_js_1 = require("../config/db.js");
const submitUrlSchema = zod_1.z.object({
    url: zod_1.z.string().url('Must provide a valid URL'),
});
const manualResultSchema = zod_1.z.object({
    manualResponseText: zod_1.z.string().min(10, 'Manual response must provide detailed observations'),
    aiWebsiteUsed: zod_1.z.enum(['META_AI', 'GROK']),
    notes: zod_1.z.string().optional(),
});
class AnalysisController {
    /**
     * POST /api/analysis - Submit social media URL for analysis
     */
    static async submit(req, res) {
        try {
            const parsed = submitUrlSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ error: parsed.error.errors[0].message });
                return;
            }
            const userId = req.user.userId;
            const job = await analysisOrchestrator_js_1.AnalysisOrchestrator.createAndDispatchJob({
                userId,
                url: parsed.data.url,
                inputSourceType: 'ORIGINAL_POST_URL',
            });
            res.status(202).json({
                message: 'Analysis job queued successfully.',
                jobId: job._id,
                status: job.jobStatus,
                platform: job.platform,
                aiWebsite: job.aiWebsite,
            });
        }
        catch (err) {
            res.status(400).json({ error: err.message || 'Failed to submit analysis.' });
        }
    }
    /**
     * POST /api/analysis/upload - Upload image or video file
     */
    static async uploadMedia(req, res) {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'No media file provided.' });
                return;
            }
            const userId = req.user.userId;
            const file = req.file;
            const isVideo = file.mimetype.startsWith('video/');
            const job = await analysisOrchestrator_js_1.AnalysisOrchestrator.createAndDispatchJob({
                userId,
                inputSourceType: 'USER_UPLOAD',
                uploadedFilePath: file.path,
                uploadedFileName: file.originalname,
            });
            job.mediaType = isVideo ? 'VIDEO' : 'IMAGE';
            await job.save();
            res.status(202).json({
                message: 'Media uploaded successfully. Analysis job initialized.',
                jobId: job._id,
                filename: file.originalname,
                mediaType: job.mediaType,
                status: job.jobStatus,
            });
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Failed processing upload.' });
        }
    }
    /**
     * GET /api/analysis/:id - Get analysis details
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            let job;
            if ((0, db_js_1.isDbConnected)()) {
                job = await Analysis_js_1.AnalysisModel.findById(id).populate('owner', 'name email role');
            }
            else {
                const { memoryStore } = await import('../models/memoryStore.js');
                job = memoryStore.analyses.get(id);
                if (job && typeof job.owner === 'string') {
                    job = { ...job, owner: memoryStore.users.get(job.owner) || { _id: job.owner, name: 'Analyst', email: 'analyst@defense.agency' } };
                }
            }
            if (!job) {
                res.status(404).json({ error: 'Analysis job not found.' });
                return;
            }
            // Check ownership or reviewer/admin role
            const ownerId = job.owner && (job.owner._id?.toString() || job.owner.toString());
            const isOwner = ownerId === req.user.userId;
            const isPrivileged = req.user.role === 'REVIEWER' || req.user.role === 'ADMIN';
            if (!isOwner && !isPrivileged) {
                res.status(403).json({ error: 'Access denied: You do not own this analysis.' });
                return;
            }
            res.json({ analysis: job });
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Error fetching analysis.' });
        }
    }
    /**
     * GET /api/analysis - List analyses with search, filter, pagination
     */
    static async list(req, res) {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
            const skip = (page - 1) * limit;
            if ((0, db_js_1.isDbConnected)()) {
                const filter = {};
                if (req.user.role === 'USER') {
                    filter.owner = req.user.userId;
                }
                if (req.query.platform)
                    filter.platform = req.query.platform;
                if (req.query.resultCategory)
                    filter.resultCategory = req.query.resultCategory;
                if (req.query.jobStatus)
                    filter.jobStatus = req.query.jobStatus;
                if (req.query.search)
                    filter.originalUrl = { $regex: req.query.search, $options: 'i' };
                const [items, total] = await Promise.all([
                    Analysis_js_1.AnalysisModel.find(filter)
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit)
                        .populate('owner', 'name email'),
                    Analysis_js_1.AnalysisModel.countDocuments(filter),
                ]);
                res.json({
                    items,
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit),
                    },
                });
            }
            else {
                const { memoryStore } = await import('../models/memoryStore.js');
                let all = Array.from(memoryStore.analyses.values());
                if (req.user.role === 'USER') {
                    all = all.filter((a) => a.owner === req.user.userId);
                }
                res.json({
                    items: all.slice(skip, skip + limit),
                    pagination: {
                        total: all.length,
                        page,
                        limit,
                        totalPages: Math.ceil(all.length / limit) || 1,
                    },
                });
            }
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Error listing analyses.' });
        }
    }
    /**
     * POST /api/analysis/:id/retry - Retries analysis execution
     */
    static async retry(req, res) {
        try {
            const { id } = req.params;
            const job = await Analysis_js_1.AnalysisModel.findById(id);
            if (!job) {
                res.status(404).json({ error: 'Analysis job not found.' });
                return;
            }
            const isOwner = job.owner.toString() === req.user.userId;
            const isPrivileged = req.user.role === 'REVIEWER' || req.user.role === 'ADMIN';
            if (!isOwner && !isPrivileged) {
                res.status(403).json({ error: 'Access denied.' });
                return;
            }
            job.jobStatus = 'PENDING';
            job.browserWorkflowStatus = 'Retrying job';
            await job.save();
            setImmediate(() => {
                analysisOrchestrator_js_1.AnalysisOrchestrator.processJobAsync(job._id.toString()).catch(() => { });
            });
            res.json({ message: 'Retry initiated.', status: job.jobStatus });
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Error retrying job.' });
        }
    }
    /**
     * POST /api/analysis/:id/manual-result - Record manual finding
     */
    static async submitManualResult(req, res) {
        try {
            const { id } = req.params;
            const parsed = manualResultSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ error: parsed.error.errors[0].message });
                return;
            }
            const job = await Analysis_js_1.AnalysisModel.findById(id);
            if (!job) {
                res.status(404).json({ error: 'Analysis job not found.' });
                return;
            }
            const { manualResponseText, aiWebsiteUsed, notes } = parsed.data;
            const interpretation = responseInterpreter_js_1.ResponseInterpreter.interpret(manualResponseText);
            job.inputSourceType = 'MANUAL_ENTRY';
            job.aiWebsite = aiWebsiteUsed;
            job.actualAiResponse = `[MANUALLY SUBMITTED BY USER]\n\n${manualResponseText}${notes ? `\n\nAnalyst Notes: ${notes}` : ''}`;
            job.resultCategory = interpretation.category;
            job.observations = [
                '[MANUAL ENTRY] User provided external AI session text.',
                ...interpretation.observations,
            ];
            job.limitations = [
                '[MANUAL WORKFLOW] Result was manually transcribed from an external session; not automatically captured by system browser automation.',
                ...interpretation.limitations,
            ];
            job.browserWorkflowStatus = 'MANUAL_COMPLETION';
            job.jobStatus = 'COMPLETED';
            job.analysisTimestamp = new Date();
            await job.save();
            res.json({
                message: 'Manual findings recorded successfully.',
                analysis: job,
            });
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Error recording manual result.' });
        }
    }
}
exports.AnalysisController = AnalysisController;
