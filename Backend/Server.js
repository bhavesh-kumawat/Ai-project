const express = require('express');
const { configureApp, appSettings } = require('./config/app.config.js');
const FrontendRoutes = require('./Routes/Frontend.routes.js');
const connectDB = require('./config/database.config.js');
require('./utils/cronjobs.js');

// Initialize Express App
const app = express();

// Configure App (Apply all middleware)
configureApp(app);

// Connect to Database
connectDB();

// Routes
app.use("/api", FrontendRoutes)

// Start Server
app.listen(appSettings.port, () => {
    console.log(`Server is running on port ${appSettings.port} in ${appSettings.env} mode`);
})