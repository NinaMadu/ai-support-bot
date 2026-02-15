const mongoose = require('mongoose');

const chatLogSchema = new mongoose.Schema({
    telegramId: {
        type: String,
        required: true,
    },
    username: String,
    message: {
        type: String,
        required: true,
    },
    response: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('ChatLog', chatLogSchema);
