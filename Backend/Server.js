const express = require('express');
const { configureApp, appSettings } = require('./config/app.config.js');
// const FrontendRoutes = require('./Routes/Frontend.routes.js');
const databaseService = require('./services/database.service.js');
const scheduler = require('./jobs/scheduler.js');
const logger = require('./utils/logger.utils.js');

// Initialize Express App
const app = express();

// Configure App (Apply all middleware)
configureApp(app);

// Setup Routes (after middleware, before server start)
// app.use("/api", FrontendRoutes);


// Start Server Wrapper
const startServer = async () => {
    try {
        // 1. Connect to Database
        await databaseService.initialize();

        // 2. Start Server
        const server = app.listen(appSettings.port, () => {
            console.log(`Server is running on port ${appSettings.port} in ${appSettings.env} mode`);
            logger.info(`🚀 Server running on port ${appSettings.port}`);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err) => {
            console.log('UNHANDLED REJECTION! 💥 Shutting down...');
            console.log(err.name, err.message);
            logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
            server.close(() => {
                process.exit(1);
            });
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();