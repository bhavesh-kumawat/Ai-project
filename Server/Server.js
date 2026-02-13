const express = require('express');
const { configureApp, appSettings } = require('./config/app.config.js');
const { initializeCloudinary, validateConfig } = require('./config/cloudinary.config.js');
const FrontendRoutes = require('./Routes/Frontend.routes.js');
const authRoutes = require('./Routes/auth.routes.js');
const creditRoutes = require('./Routes/credit.routes.js');
const paymentRoutes = require('./Routes/payment.routes.js');
const generationRoutes = require('./Routes/generation.routes.js');
const videoRoutes = require('./Routes/video.routes.js');
const projectRoutes = require('./Routes/project.routes.js');
const adminRoutes = require('./Routes/admin.routes.js');
const databaseService = require('./services/database.service.js');
const scheduler = require('./jobs/scheduler.js');
const generationJob = require('./jobs/processGeneration.job.js');
const logger = require('./utils/logger.utils.js');
const { globalErrorHandler } = require('./middleware/error.middleware.js');

// Initialize Express App
const app = express();

// Configure App (Apply all middleware)
configureApp(app);

// Setup Routes (after middleware, before server start)
app.use("/api", FrontendRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/credit", creditRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/generations", generationRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/admin", adminRoutes);

// Global error handler must be last
app.use(globalErrorHandler);

// Start Server Wrapper
const startServer = async () => {
    try {
        // 0. Validate and initialize Cloudinary
        const { valid, errors, warnings } = validateConfig();
        if (!valid) {
            errors.forEach((msg) => logger.error(`Cloudinary config error: ${msg}`));
            throw new Error('Cloudinary configuration is invalid. Check your .env values.');
        }
        warnings.forEach((msg) => logger.warn(`Cloudinary config warning: ${msg}`));

        if (!initializeCloudinary()) {
            throw new Error('Cloudinary initialization failed.');
        }

        // 1. Connect to Database
        await databaseService.initialize();

        // 2. Start Server
        const server = app.listen(appSettings.port, () => {
            console.log(`Server is running on port ${appSettings.port} in ${appSettings.env} mode`);
            logger.info(`🚀 Server running on port ${appSettings.port}`);
        });

        // 3. Start background workers
        generationJob.startGenerationWorker();

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
