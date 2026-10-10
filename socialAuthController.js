"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialAuthController = void 0;
const socialAuthService_js_1 = require("../services/socialAuthService.js");
const auth_js_1 = require("../middleware/auth.js");
const index_js_1 = require("../config/index.js");
const logger_js_1 = require("../config/logger.js");
const User_js_1 = require("../models/User.js");
const memoryStore_js_1 = require("../models/memoryStore.js");
const db_js_1 = require("../config/db.js");
class SocialAuthController {
    /**
     * GET /api/auth/social/status - Public status of Instagram and X OAuth capability
     */
    static getStatus(_req, res) {
        const status = socialAuthService_js_1.SocialAuthService.getProvidersConfigStatus();
        res.json(status);
    }
    /**
     * GET /api/auth/instagram - Initiate Instagram OAuth flow
     */
    static initiateInstagram(req, res) {
        const userId = req.user?.userId || 'guest_' + Date.now();
        const result = socialAuthService_js_1.SocialAuthService.initiateInstagramAuth(userId);
        if (!result.configured || !result.url) {
            res.json({
                provider: 'INSTAGRAM',
                configured: false,
                authUrl: null,
                message: result.message ||
                    'Instagram OAuth application credentials are not configured in server/.env. You can connect your analyst account directly below or via browser login.',
                devModeAvailable: true,
            });
            return;
        }
        if (req.query.redirect === 'true') {
            res.redirect(result.url);
            return;
        }
        res.json({
            provider: 'INSTAGRAM',
            configured: true,
            authUrl: result.url,
            state: result.state,
        });
    }
    /**
     * GET /api/auth/instagram/callback - Handle Instagram OAuth callback
     */
    static async handleInstagramCallback(req, res) {
        const { code, state, error, error_description } = req.query;
        if (error) {
            logger_js_1.logger.warn({ error, error_description }, 'Instagram authorization cancelled or denied by user');
            const redirectUrl = `${index_js_1.config.clientOrigin}/login?error=${encodeURIComponent(String(error_description || error))}&provider=INSTAGRAM`;
            res.redirect(redirectUrl);
            return;
        }
        if (!code || !state) {
            res.status(400).json({ error: 'Missing code or state query parameter from Instagram callback.' });
            return;
        }
        const result = await socialAuthService_js_1.SocialAuthService.handleInstagramCallback({
            code: String(code),
            state: String(state),
        });
        if (!result.success) {
            logger_js_1.logger.error({ error: result.error }, 'Failed processing Instagram callback');
            const redirectUrl = `${index_js_1.config.clientOrigin}/login?error=${encodeURIComponent(result.error || 'Authorization failed')}&provider=INSTAGRAM`;
            res.redirect(redirectUrl);
            return;
        }
        // Check if this was a pre-login / guest authorization
        let token;
        if (state && String(state).includes('guest_')) {
            // Find or create an Analyst account for this social user
            const username = result.connection?.providerUsername || 'analyst_ig';
            const email = `${username.toLowerCase()}@instagram.defense.agency`;
            let user;
            if ((0, db_js_1.isDbConnected)()) {
                user = await User_js_1.UserModel.findOne({ email });
                if (!user) {
                    user = await User_js_1.UserModel.create({
                        name: `Analyst (${result.connection?.providerUsername})`,
                        email,
                        passwordHash: 'social_oauth_managed',
                        role: 'USER',
                        accountStatus: 'ACTIVE',
                    });
                }
            }
            else {
                user = Array.from(memoryStore_js_1.memoryStore.users.values()).find((u) => u.email === email);
                if (!user) {
                    user = {
                        _id: 'user_ig_' + Date.now(),
                        name: `Analyst (${result.connection?.providerUsername})`,
                        email,
                        passwordHash: 'social_oauth_managed',
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
                    memoryStore_js_1.memoryStore.users.set(user._id, user);
                }
            }
            token = (0, auth_js_1.generateToken)({
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
        }
        const redirectUrl = `${index_js_1.config.clientOrigin}/login?provider=INSTAGRAM&status=connected&username=${encodeURIComponent(result.connection?.providerUsername || '')}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
        res.redirect(redirectUrl);
    }
    /**
     * GET /api/auth/x - Initiate X (Twitter) OAuth 2.0 with PKCE flow
     */
    static initiateX(req, res) {
        const userId = req.user?.userId || 'guest_' + Date.now();
        const result = socialAuthService_js_1.SocialAuthService.initiateXAuth(userId);
        if (!result.configured || !result.url) {
            res.json({
                provider: 'X',
                configured: false,
                authUrl: null,
                message: result.message ||
                    'X OAuth application credentials are not configured in server/.env. You can connect your analyst account directly below or via browser login.',
                devModeAvailable: true,
            });
            return;
        }
        if (req.query.redirect === 'true') {
            res.redirect(result.url);
            return;
        }
        res.json({
            provider: 'X',
            configured: true,
            authUrl: result.url,
            state: result.state,
        });
    }
    /**
     * GET /api/auth/x/callback - Handle X OAuth 2.0 PKCE callback
     */
    static async handleXCallback(req, res) {
        const { code, state, error, error_description } = req.query;
        if (error) {
            logger_js_1.logger.warn({ error, error_description }, 'X authorization cancelled or denied by user');
            const redirectUrl = `${index_js_1.config.clientOrigin}/login?error=${encodeURIComponent(String(error_description || error))}&provider=X`;
            res.redirect(redirectUrl);
            return;
        }
        if (!code || !state) {
            res.status(400).json({ error: 'Missing code or state query parameter from X callback.' });
            return;
        }
        const result = await socialAuthService_js_1.SocialAuthService.handleXCallback({
            code: String(code),
            state: String(state),
        });
        if (!result.success) {
            logger_js_1.logger.error({ error: result.error }, 'Failed processing X callback');
            const redirectUrl = `${index_js_1.config.clientOrigin}/login?error=${encodeURIComponent(result.error || 'Authorization failed')}&provider=X`;
            res.redirect(redirectUrl);
            return;
        }
        // Check if this was a pre-login / guest authorization
        let token;
        if (state && String(state).includes('guest_')) {
            const username = result.connection?.providerUsername || 'analyst_x';
            const email = `${username.toLowerCase()}@x.defense.agency`;
            let user;
            if ((0, db_js_1.isDbConnected)()) {
                user = await User_js_1.UserModel.findOne({ email });
                if (!user) {
                    user = await User_js_1.UserModel.create({
                        name: `Analyst (@${result.connection?.providerUsername})`,
                        email,
                        passwordHash: 'social_oauth_managed',
                        role: 'USER',
                        accountStatus: 'ACTIVE',
                    });
                }
            }
            else {
                user = Array.from(memoryStore_js_1.memoryStore.users.values()).find((u) => u.email === email);
                if (!user) {
                    user = {
                        _id: 'user_x_' + Date.now(),
                        name: `Analyst (@${result.connection?.providerUsername})`,
                        email,
                        passwordHash: 'social_oauth_managed',
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
                    memoryStore_js_1.memoryStore.users.set(user._id, user);
                }
            }
            token = (0, auth_js_1.generateToken)({
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
        }
        const redirectUrl = `${index_js_1.config.clientOrigin}/login?provider=X&status=connected&username=${encodeURIComponent(result.connection?.providerUsername || '')}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
        res.redirect(redirectUrl);
    }
    /**
     * GET /api/auth/connections - List all linked social connections for authenticated user
     */
    static async getConnections(req, res) {
        try {
            const userId = req.user.userId;
            const connections = await socialAuthService_js_1.SocialAuthService.getUserConnections(userId);
            res.json({ connections });
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Error fetching linked accounts.' });
        }
    }
    /**
     * DELETE /api/auth/connections/:provider - Disconnect a social connection
     */
    static async disconnect(req, res) {
        try {
            const userId = req.user.userId;
            const provider = String(req.params.provider).toUpperCase();
            if (provider !== 'INSTAGRAM' && provider !== 'X') {
                res.status(400).json({ error: 'Provider must be either INSTAGRAM or X.' });
                return;
            }
            const result = await socialAuthService_js_1.SocialAuthService.disconnectProvider(userId, provider);
            if (!result.success) {
                res.status(404).json({ error: result.message });
                return;
            }
            res.json({ message: result.message, provider });
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Error disconnecting account.' });
        }
    }
    /**
     * POST /api/auth/social/connect-direct - Connect Instagram or X account directly with a handle
     */
    static async connectDirect(req, res) {
        try {
            const userId = req.user.userId;
            const { provider, username } = req.body;
            const provUpper = String(provider || '').toUpperCase();
            if (provUpper !== 'INSTAGRAM' && provUpper !== 'X') {
                res.status(400).json({ error: 'Provider must be either INSTAGRAM or X.' });
                return;
            }
            const result = await socialAuthService_js_1.SocialAuthService.connectDirect({
                userId,
                provider: provUpper,
                username,
            });
            res.json({
                message: `Successfully connected ${provUpper} account as @${result.connection.providerUsername}.`,
                connection: result.connection,
            });
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Failed connecting social account.' });
        }
    }
    /**
     * POST /api/auth/social/browser-login - Launch desktop browser for official social account login
     */
    static async browserLogin(req, res) {
        try {
            const { provider } = req.body;
            const provUpper = String(provider || '').toUpperCase();
            if (provUpper !== 'INSTAGRAM' && provUpper !== 'X') {
                res.status(400).json({ error: 'Provider must be either INSTAGRAM or X.' });
                return;
            }
            const result = await socialAuthService_js_1.SocialAuthService.launchBrowserSocialLogin(provUpper);
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Failed opening browser login window.' });
        }
    }
    /**
     * POST /api/auth/social/save-browser-login - Save cookies and link account from active browser window
     */
    static async saveBrowserLogin(req, res) {
        try {
            const userId = req.user.userId;
            const { provider, usernameHint } = req.body;
            const provUpper = String(provider || '').toUpperCase();
            if (provUpper !== 'INSTAGRAM' && provUpper !== 'X') {
                res.status(400).json({ error: 'Provider must be either INSTAGRAM or X.' });
                return;
            }
            const result = await socialAuthService_js_1.SocialAuthService.saveBrowserSocialLogin(userId, provUpper, usernameHint);
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Failed saving social browser login.' });
        }
    }
    /**
     * POST /api/auth/social/cancel-browser-login - Close active social browser window without saving
     */
    static async cancelBrowserLogin(req, res) {
        try {
            const { provider } = req.body;
            const provUpper = String(provider || '').toUpperCase();
            if (provUpper !== 'INSTAGRAM' && provUpper !== 'X') {
                res.status(400).json({ error: 'Provider must be either INSTAGRAM or X.' });
                return;
            }
            const result = await socialAuthService_js_1.SocialAuthService.cancelBrowserSocialLogin(provUpper);
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Failed cancelling social browser login.' });
        }
    }
    /**
     * POST /api/auth/social/import-session - Import cookies for Instagram or X in MVP Cloud Hosting
     */
    static async importSession(req, res) {
        try {
            const userId = req.user.userId;
            const { provider, cookieData, username } = req.body;
            const provUpper = String(provider || '').toUpperCase();
            if (provUpper !== 'INSTAGRAM' && provUpper !== 'X') {
                res.status(400).json({ error: 'Provider must be either INSTAGRAM or X.' });
                return;
            }
            if (!cookieData || typeof cookieData !== 'string') {
                res.status(400).json({ error: 'Valid cookieData string is required.' });
                return;
            }
            const result = await socialAuthService_js_1.SocialAuthService.importSocialSession({
                userId,
                provider: provUpper,
                cookieData,
                username,
            });
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Failed importing social session.' });
        }
    }
}
exports.SocialAuthController = SocialAuthController;
