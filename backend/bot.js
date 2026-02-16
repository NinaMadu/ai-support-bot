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

        if (userMessage === '/start' || isGreeting(userMessage)) {
            const welcomeMessage = `<b>Konnichiwa!</b> 🌸
I'm <b>SakuraBot</b> from Sakura Japanese Language Academy.

How can I help you today? Tap a button below or type your question!`;

            bot.sendMessage(chatId, welcomeMessage, {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [
                        ['📚 Available Courses', '📅 Class Schedules'],
                        ['📞 Contact Details', '🚀 Upcoming Intakes']
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            });
            return;
        }

        try {
            const queryEmbedding = await generateEmbedding(userMessage);
            const context = await findRelevantContext(queryEmbedding);
            const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
            const prompt = `
        You are SakuraBot, a friendly and helpful support assistant.

        STRICT RULES:
        1. Use HTML tags for formatting: <b>bold</b>, <i>italic</i>, and <code>code</code>.
        2. NEVER use Markdown (like ** or __). Only use <b> for emphasis.
        3. NEVER mention "the context" or "the system."
        4. Keep responses concise and use bullet points (e.g., •) for lists.
        5. If you don't know the answer based on the context, offer to connect them to a human.
        
        Context:
        ${context}
        
        User Question: ${userMessage}
      `;

            const result = await model.generateContent(prompt);
            const botResponse = cleanResponse(result.response.text());
            bot.sendMessage(chatId, botResponse, { parse_mode: 'HTML' });
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

function cleanResponse(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&lt;b&gt;/g, '<b>')
        .replace(/&lt;\/b&gt;/g, '</b>')
        .replace(/&lt;i&gt;/g, '<i>')
        .replace(/&lt;\/i&gt;/g, '</i>');
}

function isGreeting(text) {
    const greetingRegex = /^(hi|hello|hey|he|konnichiwa|helo|hii+)\b/i;
    return greetingRegex.test(text.trim());
}

module.exports = bot;
