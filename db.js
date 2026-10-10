"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDbConnected = isDbConnected;
exports.setDbConnectedForTesting = setDbConnectedForTesting;
exports.getDbStatus = getDbStatus;
exports.seedMongoIfEmpty = seedMongoIfEmpty;
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_js_1 = require("./index.js");
const logger_js_1 = require("./logger.js");
const User_js_1 = require("../models/User.js");
let dbConnectedState = false;
let lastDbError = null;
function isDbConnected() {
    return dbConnectedState || mongoose_1.default.connection.readyState === 1;
}
function setDbConnectedForTesting(status) {
    dbConnectedState = status;
    if (!status) {
        lastDbError = 'Test mock offline mode';
    }
    else {
        lastDbError = null;
    }
}
function getDbStatus() {
    const connected = isDbConnected();
    return {
        connected,
        state: connected ? 'CONNECTED' : 'DISCONNECTED',
        error: connected ? null : lastDbError,
    };
}
/**
 * Seeds baseline administrative, analyst, and reviewer demo accounts if database is empty.
 * Preserves all existing records if the database already contains accounts.
 */
async function seedMongoIfEmpty() {
    try {
        const existingCount = await User_js_1.UserModel.countDocuments();
        if (existingCount === 0) {
            logger_js_1.logger.info('Initializing default demo accounts in MongoDB...');
            const salt = await bcryptjs_1.default.genSalt(10);
            const hash = await bcryptjs_1.default.hash('Password123!', salt);
            await User_js_1.UserModel.create([
                {
                    name: 'Analyst Demo',
                    email: 'analyst@defense.agency',
                    passwordHash: hash,
                    role: 'USER',
                    accountStatus: 'ACTIVE',
                },
                {
                    name: 'Senior Reviewer',
                    email: 'reviewer@defense.agency',
                    passwordHash: hash,
                    role: 'REVIEWER',
                    accountStatus: 'ACTIVE',
                },
                {
                    name: 'System Admin',
                    email: 'admin@defense.agency',
                    passwordHash: hash,
                    role: 'ADMIN',
                    accountStatus: 'ACTIVE',
                },
            ]);
            logger_js_1.logger.info('Default demo accounts seeded into MongoDB successfully.');
        }
    }
    catch (err) {
        logger_js_1.logger.warn({ err: err.message }, 'Notice during MongoDB user seed check');
    }
}
async function connectDB() {
    mongoose_1.default.set('bufferCommands', false);
    try {
        const sanitizedUri = index_js_1.config.mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
        logger_js_1.logger.info({ uri: sanitizedUri }, 'Connecting to MongoDB Atlas / Local...');
        await mongoose_1.default.connect(index_js_1.config.mongoUri, {
            serverSelectionTimeoutMS: 3000,
        });
        dbConnectedState = true;
        lastDbError = null;
        logger_js_1.logger.info('Connected to MongoDB successfully.');
        await seedMongoIfEmpty();
    }
    catch (err) {
        dbConnectedState = false;
        lastDbError = err.message || 'Connection failed';
        logger_js_1.logger.warn(`Could not connect to MongoDB URI (${err.message}). Database features will operate with resilient local persistence until a reachable MONGODB_URI is provided.`);
        logger_js_1.logger.info('Starting server in resilient offline database mode so platform detection and AI status endpoints remain operational.');
    }
}
async function disconnectDB() {
    if (mongoose_1.default.connection.readyState !== 0) {
        await mongoose_1.default.disconnect();
    }
    dbConnectedState = false;
}
