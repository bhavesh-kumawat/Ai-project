const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testOpenAI() {
    console.log('Testing OpenAI...');
    try {
        const res = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'hi' }]
        }, {
            headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
        });
        console.log('✅ OpenAI OK');
    } catch (err) {
        console.error('❌ OpenAI Failed:', err.response?.status, err.response?.data || err.message);
    }
}

async function testStability() {
    console.log('Testing Stability...');
    try {
        const res = await axios.get('https://api.stability.ai/v1/user/balance', {
            headers: { Authorization: `Bearer ${process.env.STABILITY_API_KEY}` }
        });
        console.log('✅ Stability OK (Credits:', res.data.credits, ')');
    } catch (err) {
        console.error('❌ Stability Failed:', err.response?.status, err.response?.data || err.message);
    }
}

async function testGemini(modelName) {
    console.log(`Testing Gemini with ${modelName}...`);
    try {
        const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            contents: [{ parts: [{ text: 'hi' }] }]
        });
        console.log(`✅ Gemini ${modelName} OK`);
    } catch (err) {
        console.error(`❌ Gemini ${modelName} Failed:`, err.response?.status, err.response?.data || err.message);
    }
}

async function run() {
    await testOpenAI();
    await testStability();
    const configModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-exp-image-generation';
    await testGemini(configModel);
    await testGemini('gemini-1.5-flash');
}

run();
