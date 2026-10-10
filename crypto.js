"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptToken = encryptToken;
exports.decryptToken = decryptToken;
exports.generatePkcePair = generatePkcePair;
exports.generateOAuthState = generateOAuthState;
exports.verifyOAuthState = verifyOAuthState;
const crypto_1 = __importDefault(require("crypto"));
const index_js_1 = require("../config/index.js");
// Derive 32-byte encryption key from session/JWT secret
const ENCRYPTION_KEY = crypto_1.default.createHash('sha256').update(index_js_1.config.sessionSecret || index_js_1.config.jwtSecret).digest();
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
/**
 * Encrypt sensitive OAuth tokens before storing at rest
 */
function encryptToken(plainText) {
    if (!plainText)
        return '';
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    // Format: iv:tag:encrypted (base64)
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}
/**
 * Decrypt sensitive OAuth tokens for backend API calls
 */
function decryptToken(encryptedText) {
    if (!encryptedText)
        return '';
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 3)
            return '';
        const iv = Buffer.from(parts[0], 'base64');
        const tag = Buffer.from(parts[1], 'base64');
        const encrypted = Buffer.from(parts[2], 'base64');
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString('utf8');
    }
    catch {
        return '';
    }
}
/**
 * Generate PKCE Code Verifier and S256 Code Challenge for OAuth 2.0 (RFC 7636)
 */
function generatePkcePair() {
    // Code verifier: 43-128 random unreserved characters
    const codeVerifier = crypto_1.default.randomBytes(32).toString('base64url');
    // Code challenge: BASE64URL-ENCODE(SHA256(codeVerifier))
    const codeChallenge = crypto_1.default
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');
    return { codeVerifier, codeChallenge };
}
/**
 * Generate a cryptographically random OAuth state token for CSRF protection
 */
function generateOAuthState(userId, provider) {
    const nonce = crypto_1.default.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const payload = `${userId}:${provider}:${timestamp}:${nonce}`;
    const hmac = crypto_1.default.createHmac('sha256', ENCRYPTION_KEY).update(payload).digest('hex');
    return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}
/**
 * Verify OAuth state token and extract payload
 */
function verifyOAuthState(state) {
    try {
        const decoded = Buffer.from(state, 'base64url').toString('utf8');
        const parts = decoded.split(':');
        if (parts.length !== 5)
            return { valid: false };
        const [userId, provider, timestampStr, nonce, receivedHmac] = parts;
        const payload = `${userId}:${provider}:${timestampStr}:${nonce}`;
        const expectedHmac = crypto_1.default.createHmac('sha256', ENCRYPTION_KEY).update(payload).digest('hex');
        if (receivedHmac !== expectedHmac)
            return { valid: false };
        // State expires after 15 minutes
        const age = Date.now() - parseInt(timestampStr, 10);
        if (age > 15 * 60 * 1000)
            return { valid: false };
        return {
            valid: true,
            userId,
            provider: provider,
        };
    }
    catch {
        return { valid: false };
    }
}
