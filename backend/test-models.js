const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const list = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }).listModels();
        console.log(list);
    } catch (e) {
        console.error(e);
    }
}

listModels();
