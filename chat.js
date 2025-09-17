const chatDiv = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");

let chatHistory = []; // یہ locally رکھیں گے اور API میں بھی بھیجیں گے
const bot_id = "10420";
const chatbot_identity = "custom_bot_10420";
const post_id = "261";
const client_id = "vvHZZ88WOV";
const nonce = "82fadd3b23";

function renderChat() {
  chatDiv.innerHTML = "";
  chatHistory.forEach(msg => {
    const div = document.createElement("div");
    div.classList.add("message");
    div.innerHTML = `<span class="${msg.sender}">${msg.sender}:</span> ${msg.text}`;
    chatDiv.appendChild(div);
  });
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

async function sendMessage(message) {
  chatHistory.push({ sender: "user", text: message });
  renderChat();

  const formData = new FormData();
  formData.append("_wpnonce", nonce);
  formData.append("post_id", post_id);
  formData.append("url", "https://chatgptfree.ai/chat");
  formData.append("action", "wpaicg_chat_shortcode_message");
  formData.append("message", message);
  formData.append("bot_id", bot_id);
  formData.append("chatbot_identity", chatbot_identity);
  formData.append("wpaicg_chat_history", JSON.stringify(chatHistory));
  formData.append("wpaicg_chat_client_id", client_id);

  try {
    const res = await fetch("https://chatgptfree.ai/wp-admin/admin-ajax.php", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    chatHistory.push({ sender: "bot", text: data.response || "No response" });
    renderChat();
  } catch (err) {
    console.error(err);
    chatHistory.push({ sender: "bot", text: "Error contacting API" });
    renderChat();
  }
}

sendBtn.addEventListener("click", () => {
  const message = messageInput.value.trim();
  if (!message) return;
  messageInput.value = "";
  sendMessage(message);
});

// Delete / Clear chat
clearBtn.addEventListener("click", async () => {
  if (!confirm("Are you sure you want to delete chat history?")) return;

  chatHistory = [];
  renderChat();

  // Optionally, notify API about clearing
  const formData = new FormData();
  formData.append("_wpnonce", nonce);
  formData.append("post_id", post_id);
  formData.append("action", "wpaicg_clear_chat_history"); // فرضی API action، آپ کو API دیکھ کر change کرنا ہوگا
  formData.append("wpaicg_chat_client_id", client_id);

  try {
    await fetch("https://chatgptfree.ai/wp-admin/admin-ajax.php", {
      method: "POST",
      body: formData
    });
  } catch (err) {
    console.error("Failed to clear chat history on API:", err);
  }
});
