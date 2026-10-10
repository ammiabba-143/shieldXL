"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryStore = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class MemoryStore {
    users = new Map();
    analyses = new Map();
    notifications = new Map();
    reviews = new Map();
    socialConnections = new Map();
    constructor() {
        this.seedDefaults();
    }
    seedDefaults() {
        const salt = bcryptjs_1.default.genSaltSync(10);
        const hash = bcryptjs_1.default.hashSync('Password123!', salt);
        // 1. Demo Analyst User
        const analyst = {
            _id: 'user_analyst_001',
            name: 'Analyst Demo',
            email: 'analyst@defense.agency',
            passwordHash: hash,
            role: 'USER',
            accountStatus: 'ACTIVE',
            notificationPreferences: {
                emailOnComplete: true,
                emailOnReviewNeeded: true,
                emailOnFailure: true,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // 2. Demo Reviewer User
        const reviewer = {
            _id: 'user_reviewer_002',
            name: 'Senior Reviewer',
            email: 'reviewer@defense.agency',
            passwordHash: hash,
            role: 'REVIEWER',
            accountStatus: 'ACTIVE',
            notificationPreferences: {
                emailOnComplete: true,
                emailOnReviewNeeded: true,
                emailOnFailure: true,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // 3. Demo Admin User
        const admin = {
            _id: 'user_admin_003',
            name: 'System Admin',
            email: 'admin@defense.agency',
            passwordHash: hash,
            role: 'ADMIN',
            accountStatus: 'ACTIVE',
            notificationPreferences: {
                emailOnComplete: true,
                emailOnReviewNeeded: true,
                emailOnFailure: true,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.users.set(analyst._id, analyst);
        this.users.set(reviewer._id, reviewer);
        this.users.set(admin._id, admin);
        this.loadFromDisk();
    }
    getStoragePath() {
        return path_1.default.resolve(process.cwd(), '.dev-store.json');
    }
    save() {
        try {
            const data = {
                users: Array.from(this.users.entries()),
                analyses: Array.from(this.analyses.entries()),
                notifications: Array.from(this.notifications.entries()),
                reviews: Array.from(this.reviews.entries()),
                socialConnections: Array.from(this.socialConnections.entries()),
            };
            fs_1.default.writeFileSync(this.getStoragePath(), JSON.stringify(data, null, 2), 'utf-8');
        }
        catch {
            // Ignore disk write errors in restricted environments
        }
    }
    loadFromDisk() {
        try {
            const filePath = this.getStoragePath();
            if (!fs_1.default.existsSync(filePath))
                return;
            const raw = fs_1.default.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(raw);
            if (Array.isArray(data.users)) {
                for (const [k, v] of data.users) {
                    this.users.set(k, { ...v, createdAt: new Date(v.createdAt), updatedAt: new Date(v.updatedAt) });
                }
            }
            if (Array.isArray(data.analyses)) {
                for (const [k, v] of data.analyses) {
                    this.analyses.set(k, { ...v, createdAt: new Date(v.createdAt), updatedAt: new Date(v.updatedAt) });
                }
            }
            if (Array.isArray(data.notifications)) {
                for (const [k, v] of data.notifications) {
                    this.notifications.set(k, { ...v, createdAt: new Date(v.createdAt), updatedAt: new Date(v.updatedAt) });
                }
            }
            if (Array.isArray(data.reviews)) {
                for (const [k, v] of data.reviews) {
                    this.reviews.set(k, { ...v, createdAt: new Date(v.createdAt), updatedAt: new Date(v.updatedAt) });
                }
            }
            if (Array.isArray(data.socialConnections)) {
                for (const [k, v] of data.socialConnections) {
                    this.socialConnections.set(k, { ...v, createdAt: new Date(v.createdAt), updatedAt: new Date(v.updatedAt) });
                }
            }
        }
        catch {
            // Ignore disk parse errors
        }
    }
}
exports.memoryStore = new MemoryStore();
