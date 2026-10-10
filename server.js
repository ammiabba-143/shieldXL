"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = require("./app.js");
const index_js_1 = require("./config/index.js");
const db_js_1 = require("./config/db.js");
const logger_js_1 = require("./config/logger.js");
const browserSessionManager_js_1 = require("./services/browserSessionManager.js");
async function bootstrap() {
    try {
        await (0, db_js_1.connectDB)();
        const server = app_js_1.app.listen(index_js_1.config.port, () => {
            logger_js_1.logger.info(`Server running in ${index_js_1.config.env} mode on http://localhost:${index_js_1.config.port}`);
            logger_js_1.logger.info(`Ready to route Meta (FB/IG) to Meta AI and X/Twitter to Grok`);
        });
        const gracefulShutdown = async (signal) => {
            logger_js_1.logger.info(`Received ${signal}. Shutting down gracefully...`);
            server.close(async () => {
                try {
                    await browserSessionManager_js_1.browserSessionManager.closeAll();
                    await (0, db_js_1.disconnectDB)();
                    logger_js_1.logger.info('Clean shutdown completed.');
                    process.exit(0);
                }
                catch (err) {
                    logger_js_1.logger.error({ err }, 'Error during shutdown');
                    process.exit(1);
                }
            });
        };
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    }
    catch (err) {
        logger_js_1.logger.fatal({ err: err.message }, 'Bootstrap fatal error. Server halted.');
        process.exit(1);
    }
}
bootstrap();
