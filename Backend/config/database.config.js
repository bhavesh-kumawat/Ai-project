require('dotenv').config();
const mongoose = require('mongoose');
const { appSettings } = require('./app.config.js');

const connectDB = async () => {
    try {
        const connect = await mongoose.connect(appSettings.database.uri);
        console.log(`MongoDB Connected: ${connect.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;