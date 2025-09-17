// index.js
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to handle chat messages
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        const formData = new URLSearchParams();
        formData.append('_wpnonce', '82fadd3b23');
        formData.append('post_id', '261');
        formData.append('url', 'https://chatgptfree.ai/chat');
        formData.append('action', 'wpaicg_chat_shortcode_message');
        formData.append('message', message);
        formData.append('bot_id', '10420');
        formData.append('chatbot_identity', 'custom_bot_10420');
        formData.append('wpaicg_chat_history', JSON.stringify(history)); // History will be sent here
        formData.append('wpaicg_chat_client_id', 'vvHZZ88WOV');

        const response = await fetch('https://chatgptfree.ai/wp-admin/admin-ajax.php', {
            method: 'POST',
            headers: {
                // User-Agent to mimic a browser
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        // Handle both JSON and non-JSON responses
        const responseText = await response.text();
        
        try {
            const data = JSON.parse(responseText);
            res.json(data);
        } catch (parseError) {
            console.error('Failed to parse JSON, received:', responseText);
            res.status(500).json({ status: 'error', msg: 'API returned a non-JSON response.', debug: responseText });
        }

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ status: 'error', msg: 'Something went wrong on the server' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
