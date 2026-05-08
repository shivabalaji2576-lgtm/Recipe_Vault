require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Bland AI Credentials
const BLAND_API_KEY = process.env.BLAND_API_KEY || "org_c3c753ba5492770b531423c1c3c178a15328489d069c123abb8f8117651abf1db1df779d546675089de169";
const BLAND_FROM_NUMBER = process.env.BLAND_FROM_NUMBER || "+13852332986";

// Debug: Print which key is being loaded
console.log("🔑 Using Bland API Key:", BLAND_API_KEY.substring(0, 8) + "...");
console.log("📞 Using From Number:", BLAND_FROM_NUMBER);

// ── Test endpoint: verify the API key is working ──
app.get('/test-key', async (req, res) => {
  try {
    const response = await axios.get("https://api.bland.ai/v1/me", {
      headers: { "authorization": BLAND_API_KEY }
    });
    console.log("✅ Key valid! Account:", JSON.stringify(response.data));
    res.json({ ok: true, account: response.data });
  } catch (err) {
    console.error("❌ Key test failed:", err.response?.data || err.message);
    res.status(401).json({ ok: false, error: err.response?.data || err.message });
  }
});

app.post('/call', async (req, res) => {
  try {
    const { phone, name, items } = req.body;

    // Fix Phone Format
    let cleanPhone = phone.replace(/\s+/g, '');
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+91${cleanPhone}`;
    }

    const firstSentence = `Hello ${name}! Your order has been placed successfully. This is an automated confirmation call from Recipe Vault.`;

    const task = `
      You are an automated order confirmation assistant for RecipeVault, Hyderabad.
      Say: "Your order has been placed successfully!"
      Then say: "You have ordered: ${items}."
      Then say: "Your order will be delivered in 30 to 45 minutes."
      Then say: "Thank you for choosing Recipe Vault. Have a healthy day!"
      Keep it short. Do not ask any questions.
    `;

    const payload = {
      phone_number: cleanPhone,
      from: BLAND_FROM_NUMBER,
      task: task,
      first_sentence: firstSentence,
      voice: "maya",
      amd: false,
      wait_for_greeting: false,
      record: false,
      language: "en-US",
      local_dialing: true,   // Routes via local infrastructure — avoids spam block
    };

    console.log(`☎️ Calling: ${cleanPhone} | From: ${BLAND_FROM_NUMBER} | Key: ${BLAND_API_KEY.substring(0, 8)}...`);

    const response = await axios.post("https://api.bland.ai/v1/calls", payload, {
      headers: {
        "authorization": BLAND_API_KEY,
        "Content-Type": "application/json"
      }
    });

    console.log("✅ Call initiated:", JSON.stringify(response.data));
    res.json({ ok: true, data: response.data });
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error('❌ Bland AI Error:', JSON.stringify(errData));
    res.status(500).json({ ok: false, error: errData });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Bland AI Proxy Server running on http://localhost:${PORT}`);
  console.log(`   Test key: http://localhost:${PORT}/test-key\n`);
});
