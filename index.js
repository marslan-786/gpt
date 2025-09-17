// index.js (یا آپ کی Vercel API file)
const fetch = require("node-fetch");
const FormData = require("form-data");
const express = require('express'); // Express framework for handling requests
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    const form = new FormData();
    // Corrected the nonce value by removing the extra single quote
    form.append("_wpnonce", "82fadd3b23");
    form.append("post_id", "261");
    form.append("url", "https://chatgptfree.ai/chat");
    form.append("action", "wpaicg_chat_shortcode_message");
    form.append("message", message);
    form.append("bot_id", "10420");
    form.append("chatbot_identity", "custom_bot_10420");
    form.append("wpaicg_chat_history", JSON.stringify(history));
    form.append("wpaicg_chat_client_id", "vvHZZ88WOV");

    const response = await fetch("https://chatgptfree.ai/wp-admin/admin-ajax.php", {
      method: "POST",
      body: form,
      headers: {
        ...form.getHeaders(),
        "User-Agent": "Mozilla/5.0 (Node.js Vercel Bot)"
      },
    });

    const rawText = await response.text();
    
    // Log the raw text to see if it's correct
    console.log('Raw API response:', rawText);

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      console.error('JSON Parse Error:', e);
      return res.status(500).json({
        success: false,
        msg: "Invalid JSON response from API",
        debug: rawText // This will show the HTML error
      });
    }

    res.status(200).json(parsed);

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
