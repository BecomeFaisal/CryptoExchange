require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
const app = express();

// Parse JSON bodies
app.use(express.json());

// Replace this with the target server URL
const targetUrl = 'https://api.backpack.exchange';

// Handle CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
    next();
});

// AI Chat route
app.post('/ai/chat', async (req, res) => {
    const { message, market } = req.body;

    if (!process.env.HUGGINGFACE_API_KEY) {
        console.error('Hugging Face API key is not set. Check .env and restart the proxy.');
        return res.status(500).json({ reply: 'Server configuration error: missing Hugging Face API key.' });
    }

    try {
        const prompt = `You are a trading assistant for ${market}. ${message}`;
        const response = await axios.post(
            'https://router.huggingface.co/v1/chat/completions',
            {
                model: 'openai/gpt-oss-120b:fastest',
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: 120,
                temperature: 0.8,
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const reply =
            response.data?.choices?.[0]?.message?.content ||
            response.data?.choices?.[0]?.text ||
            'Sorry, I couldn\'t generate a response.';

        res.json({ reply });
    } catch (error) {
        console.error(
            'AI chat request failed:',
            error.response?.status,
            error.response?.data || error.message || error
        );
        res.status(500).json({ reply: 'Error generating response.' });
    }
});

app.use('/', createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
        // Optionally, you can modify the request here
    },
    onProxyRes: (proxyRes, req, res) => {
        // Optionally, you can modify the response here
    }
}));

const port = 3010;
app.listen(port, () => {
    console.log(`Proxy server running on http://localhost:${port}`);
});
