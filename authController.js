"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const User_js_1 = require("../models/User.js");
const auth_js_1 = require("../middleware/auth.js");
const db_js_1 = require("../config/db.js");
const memoryStore_js_1 = require("../models/memoryStore.js");
const logger_js_1 = require("../config/logger.js");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(60),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    role: zod_1.z.enum(['USER', 'REVIEWER', 'ADMIN']).optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
class AuthController {
    static async register(req, res) {
        try {
            const parsed = registerSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ error: parsed.error.errors[0].message });
                return;
            }
            const { name, email, password } = parsed.data;
            const normalizedEmail = email.trim().toLowerCase();
            const assignedRole = 'USER'; // Public registrations are always assigned standard USER role
            let existing;
            if ((0, db_js_1.isDbConnected)()) {
                existing = await User_js_1.UserModel.findOne({ email: normalizedEmail });
            }
            else {
                existing = Array.from(memoryStore_js_1.memoryStore.users.values()).find((u) => u.email === normalizedEmail);
            }
            if (existing) {
                logger_js_1.logger.warn({ email: normalizedEmail }, 'Registration rejected: Account already exists');
                res.status(409).json({ error: 'An account with this email already exists.' });
                return;
            }
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash(password, salt);
            let user;
            if ((0, db_js_1.isDbConnected)()) {
                user = await User_js_1.UserModel.create({
                    name: name.trim(),
                    email: normalizedEmail,
                    passwordHash,
                    role: assignedRole,
                });
            }
            else {
                user = {
                    _id: 'user_' + Date.now(),
                    name: name.trim(),
                    email: normalizedEmail,
                    passwordHash,
                    role: assignedRole,
                    accountStatus: 'ACTIVE',
                    notificationPreferences: {
                        emailOnComplete: true,
                        emailOnReviewNeeded: true,
                        emailOnFailure: true,
                    },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                memoryStore_js_1.memoryStore.users.set(user._id, user);
                memoryStore_js_1.memoryStore.save();
            }
            logger_js_1.logger.info({ email: normalizedEmail, userId: user._id }, 'New user account created successfully');
            const token = (0, auth_js_1.generateToken)({
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
            });
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.status(201).json({
                message: 'Account registered successfully.',
                token,
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        }
        catch (err) {
            logger_js_1.logger.error({ err: err.message }, 'Unexpected error during user registration');
            res.status(500).json({ error: err.message || 'Registration failed.' });
        }
    }
    static async login(req, res) {
        try {
            const parsed = loginSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ error: parsed.error.errors[0].message });
                return;
            }
            const { email, password } = parsed.data;
            const normalizedEmail = email.trim().toLowerCase();
            let user;
            if ((0, db_js_1.isDbConnected)()) {
                user = await User_js_1.UserModel.findOne({ email: normalizedEmail });
            }
            else {
                user = Array.from(memoryStore_js_1.memoryStore.users.values()).find((u) => u.email === normalizedEmail);
            }
            if (!user) {
                logger_js_1.logger.warn({ email: normalizedEmail }, 'Authentication failed: User account not found');
                res.status(401).json({ error: 'Invalid email or password.' });
                return;
            }
            const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
            if (!isMatch) {
                logger_js_1.logger.warn({ email: normalizedEmail }, 'Authentication failed: Password mismatch');
                res.status(401).json({ error: 'Invalid email or password.' });
                return;
            }
            if (user.accountStatus !== 'ACTIVE') {
                logger_js_1.logger.warn({ email: normalizedEmail }, 'Authentication rejected: Account suspended');
                res.status(403).json({ error: 'Account is suspended. Please contact administrator.' });
                return;
            }
            const token = (0, auth_js_1.generateToken)({
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
            });
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            logger_js_1.logger.info({ email: normalizedEmail, userId: user._id }, 'User authenticated successfully');
            res.json({
                message: 'Logged in successfully.',
                token,
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        }
        catch (err) {
            logger_js_1.logger.error({ err: err.message }, 'Unexpected error during user login');
            res.status(500).json({ error: err.message || 'Login failed.' });
        }
    }
    static async logout(_req, res) {
        res.clearCookie('token');
        logger_js_1.logger.info('User session logged out successfully');
        res.json({ message: 'Logged out successfully.' });
    }
    static async me(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated.' });
                return;
            }
            let user;
            if ((0, db_js_1.isDbConnected)()) {
                user = await User_js_1.UserModel.findById(req.user.userId).select('-passwordHash');
            }
            else {
                const mUser = memoryStore_js_1.memoryStore.users.get(req.user.userId);
                if (mUser) {
                    const { passwordHash: _, ...rest } = mUser;
                    user = rest;
                }
            }
            if (!user) {
                logger_js_1.logger.warn({ userId: req.user.userId }, 'Profile lookup failed: User not found');
                res.status(404).json({ error: 'User not found.' });
                return;
            }
            res.json({
                user: {
                    id: user._id ? user._id.toString() : user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    accountStatus: user.accountStatus,
                },
            });
        }
        catch (err) {
            logger_js_1.logger.error({ err: err.message }, 'Failed fetching user profile');
            res.status(500).json({ error: err.message || 'Failed fetching user profile.' });
        }
    }
}
exports.AuthController = AuthController;
