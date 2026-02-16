const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { generateEmbedding } = require('./utils/embeddings');
const { findRelevantContext } = require('./utils/vectorSearch');
const ChatLog = require('./models/ChatLog');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let bot;

if (token) {
    bot = new TelegramBot(token, { polling: true });

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const userMessage = msg.text;

        if (!userMessage) return;

        if (userMessage === '/start') {
            bot.sendMessage(chatId, 'Welcome! How can I help you today?');
            return;
        }

        try {
            const queryEmbedding = await generateEmbedding(userMessage);
            const context = await findRelevantContext(queryEmbedding);
            const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
            const prompt = `
        You are a helpful customer support assistant as telegram bot.
        Use the following pieces of context to answer the user's question.
        If the context doesn't contain the answer, tell the user you don't know but try to be helpful based on general knowledge if appropriate, or ask them to contact human support.
        
        Context:
        ${context}
        
        User Question: ${userMessage}
      `;

            const result = await model.generateContent(prompt);
            const botResponse = result.response.text();
            bot.sendMessage(chatId, botResponse);
            const chatLog = new ChatLog({
                telegramId: chatId.toString(),
                username: msg.from.username || msg.from.first_name,
                message: userMessage,
                response: botResponse,
            });
            await chatLog.save();

        } catch (error) {
            console.error('Bot error:', error);
            bot.sendMessage(chatId, "I'm sorry, I'm having some trouble processing your request right now.");
        }
    });

    console.log('Telegram bot is running...');
} else {
    console.log('TELEGRAM_BOT_TOKEN not found in .env, bot is disabled.');
}

module.exports = bot;
