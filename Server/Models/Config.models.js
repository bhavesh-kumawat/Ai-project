const mongoose = require("mongoose");

const ConfigSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        category: {
            type: String,
            required: true,
            enum: ["generation", "security", "billing", "email", "platform"],
            default: "platform",
        },
        description: {
            type: String,
            trim: true,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Config", ConfigSchema);
