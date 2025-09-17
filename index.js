// index.js
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const FormData = require('form-data'); // Add this line

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        // Use form-data to create the payload like curl does
        const form = new FormData();
        form.append('_wpnonce', '82fadd3b23');
        form.append('post_id', '261');
        form.append('url', 'https://chatgptfree.ai/chat');
        form.append('action', 'wpaicg_chat_shortcode_message');
        form.append('message', message);
        form.append('bot_id', '10420');
        form.append('chatbot_identity', 'custom_bot_10420');
        form.append('wpaicg_chat_history', JSON.stringify(history));
        form.append('wpaicg_chat_client_id', 'vvHZZ88WOV');

        const response = await fetch('https://chatgptfree.ai/wp-admin/admin-ajax.php', {
            method: 'POST',
            headers: {
                // Use the User-Agent that works
                'User-Agent': 'Mozilla/5.0 (Node.js Vercel Bot)',
                // Do not set Content-Type, form-data handles it
            },
            body: form
        });

        const responseText = await response.text();
        
        try {
            const data = JSON.parse(responseText);
            res.json(data);
        } catch (parseError) {
            console.error('Failed to parse JSON. API returned:', responseText);
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
                
