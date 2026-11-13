require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const authenticateToken = require('./middleware/auth');
const { findSubstitutes } = require('./services/substitution');

// Validate required environment variables at startup
const REQUIRED_ENV_VARS = ['BLAND_API_KEY', 'BLAND_FROM_NUMBER', 'GEMINI_API_KEY', 'JWT_SECRET'];
const missingVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`Startup Error: Missing required environment variable(s): ${missingVars.join(', ')}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// CORS configuration restricted to allowed origins
const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://shivabalaji2576-lgtm.github.io'];
const configuredOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : defaultOrigins;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || configuredOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));

app.use(express.json({ limit: '100kb' }));

// Credentials from environment variables
const BLAND_API_KEY = process.env.BLAND_API_KEY;
const BLAND_FROM_NUMBER = process.env.BLAND_FROM_NUMBER;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// Rate limiters
const callLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many call requests. Please try again later.' },
});

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many chat requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many authentication attempts. Please try again later.' },
});

// ── Auth Endpoints ──

// POST /auth/register
app.post('/auth/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ ok: false, error: 'Enter a valid email.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ ok: false, error: 'Password must be ≥ 6 characters.' });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ ok: false, error: 'Please enter your name.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ ok: false, error: 'Account exists. Sign in.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password_hash, name, phone) VALUES (?, ?, ?, ?)');
    const info = stmt.run(cleanEmail, passwordHash, name.trim(), phone ? String(phone).trim() : '');

    const newUser = {
      id: info.lastInsertRowid,
      email: cleanEmail,
      name: name.trim(),
      phone: phone ? String(phone).trim() : '',
    };

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, token, user: newUser });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ ok: false, error: 'Internal registration error.' });
  }
});

// POST /auth/login
app.post('/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password are required.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const user = db.prepare('SELECT id, email, password_hash, name, phone FROM users WHERE email = ?').get(cleanEmail);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'No account found. Sign up.' });
    }

    const match = await bcrypt.compare(String(password), user.password_hash);
    if (!match) {
      return res.status(401).json({ ok: false, error: 'Incorrect password.' });
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
    };

    const token = jwt.sign({ id: safeUser.id, email: safeUser.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ ok: false, error: 'Internal login error.' });
  }
});

// GET /auth/me (Protected)
app.get('/auth/me', authenticateToken, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// PUT /auth/profile (Protected)
app.put('/auth/profile', authenticateToken, (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ ok: false, error: 'Name is required.' });
    }

    db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(
      name.trim(),
      phone ? String(phone).trim() : '',
      req.user.id
    );

    const updated = db.prepare('SELECT id, email, name, phone FROM users WHERE id = ?').get(req.user.id);
    res.json({ ok: true, user: updated });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to update profile.' });
  }
});

// ── User Data Endpoints (Scoped to Logged-in User) ──

// Cart
app.get('/api/cart', authenticateToken, (req, res) => {
  try {
    const row = db.prepare('SELECT cart_json FROM carts WHERE user_id = ?').get(req.user.id);
    const cart = row ? JSON.parse(row.cart_json) : [];
    res.json({ ok: true, cart });
  } catch (err) {
    console.error('Fetch cart error:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to fetch cart.' });
  }
});

app.put('/api/cart', authenticateToken, (req, res) => {
  try {
    const cart = Array.isArray(req.body.cart) ? req.body.cart : [];
    db.prepare(`
      INSERT INTO carts (user_id, cart_json, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET cart_json = excluded.cart_json, updated_at = CURRENT_TIMESTAMP
    `).run(req.user.id, JSON.stringify(cart));
    res.json({ ok: true, cart });
  } catch (err) {
    console.error('Save cart error:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to save cart.' });
  }
});

// Orders
app.get('/api/orders', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT order_json FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    const orders = rows.map((r) => JSON.parse(r.order_json));
    res.json({ ok: true, orders });
  } catch (err) {
    console.error('Fetch orders error:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to fetch orders.' });
  }
});

app.post('/api/orders', authenticateToken, (req, res) => {
  try {
    const order = req.body.order;
    if (!order || !order.id) {
      return res.status(400).json({ ok: false, error: 'Invalid order data.' });
    }
    db.prepare('INSERT INTO orders (id, user_id, order_json) VALUES (?, ?, ?)').run(
      String(order.id),
      req.user.id,
      JSON.stringify(order)
    );
    res.json({ ok: true, order });
  } catch (err) {
    console.error('Create order error:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to save order.' });
  }
});

// Meal Plan
app.get('/api/mealplan', authenticateToken, (req, res) => {
  try {
    const row = db.prepare('SELECT plan_json, auto_on FROM meal_plans WHERE user_id = ?').get(req.user.id);
    const mealPlan = row ? JSON.parse(row.plan_json) : null;
    const autoOn = row ? Boolean(row.auto_on) : false;
    res.json({ ok: true, mealPlan, autoOn });
  } catch (err) {
    console.error('Fetch meal plan error:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to fetch meal plan.' });
  }
});

app.put('/api/mealplan', authenticateToken, (req, res) => {
  try {
    const { mealPlan, autoOn } = req.body;
    db.prepare(`
      INSERT INTO meal_plans (user_id, plan_json, auto_on, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        plan_json = excluded.plan_json,
        auto_on = excluded.auto_on,
        updated_at = CURRENT_TIMESTAMP
    `).run(req.user.id, JSON.stringify(mealPlan || {}), autoOn ? 1 : 0);
    res.json({ ok: true, mealPlan, autoOn: Boolean(autoOn) });
  } catch (err) {
    console.error('Save meal plan error:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to save meal plan.' });
  }
});

// Addresses
app.get('/api/addresses', authenticateToken, (req, res) => {
  try {
    const row = db.prepare('SELECT addresses_json, default_addr_id FROM user_addresses WHERE user_id = ?').get(req.user.id);
    const addresses = row ? JSON.parse(row.addresses_json) : [];
    const defaultAddr = row ? row.default_addr_id : '';
    res.json({ ok: true, addresses, defaultAddr });
  } catch (err) {
    console.error('Fetch addresses error:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to fetch addresses.' });
  }
});

app.put('/api/addresses', authenticateToken, (req, res) => {
  try {
    const addresses = Array.isArray(req.body.addresses) ? req.body.addresses : [];
    const defaultAddr = req.body.defaultAddr ? String(req.body.defaultAddr) : '';
    db.prepare(`
      INSERT INTO user_addresses (user_id, addresses_json, default_addr_id, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        addresses_json = excluded.addresses_json,
        default_addr_id = excluded.default_addr_id,
        updated_at = CURRENT_TIMESTAMP
    `).run(req.user.id, JSON.stringify(addresses), defaultAddr);
    res.json({ ok: true, addresses, defaultAddr });
  } catch (err) {
    console.error('Save addresses error:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to save addresses.' });
  }
});

// ── Ingredient Substitution (Option A) ──
// GET /api/substitutes?ingredient=butter
app.get('/api/substitutes', (req, res) => {
  try {
    const ingredient = req.query.ingredient;
    if (!ingredient || typeof ingredient !== 'string' || !ingredient.trim()) {
      return res.status(400).json({ ok: false, error: 'Ingredient query parameter is required.' });
    }
    const result = findSubstitutes(ingredient.trim());
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Substitutes error:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to find substitutes.' });
  }
});


// ── Chatbot & Calling Endpoints ──

const SYSTEM_PROMPT = `You are a friendly and helpful food assistant for RecipeVault, a healthy meal delivery app in Hyderabad, India. Help users with:
- Recipes, cooking tips, and ingredient suggestions
- Cart & ordering: users tap "Add to Cart" on recipe cards, a cart drawer slides in from the right, they tap "Place Order" to confirm
- Ingredient ordering: on recipe detail pages, users can add individual ingredients to cart with the 🛒 button on each ingredient chip, or add all ingredients at once with the "Order All Ingredients" button
- Meal planning (Breakfast, Lunch, Dinner for each day of the week)
- Nutrition and healthy eating advice
- Hyderabad cuisine: biryani, haleem, mirchi ka salan, qubani ka meetha, etc.
- Restaurants: Paradise Biryani ⭐4.8, Chutneys ⭐4.6, Bawarchi ⭐4.5, Hotel Shadab ⭐4.7, Eat Street ⭐4.3, Ohri's Dum Pukht ⭐4.4
- Prices: ₹149–₹649 per meal, ₹29–₹119 per ingredient, ₹49 flat delivery, 30–45 min ETA, Hyderabad only
Keep responses concise, warm, and helpful. Use emojis occasionally.`;

// POST /chat
app.post('/chat', chatLimiter, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 1000) {
      return res.status(400).json({ ok: false, error: 'Invalid message. Must be a string up to 1000 characters.' });
    }

    if (history && (!Array.isArray(history) || history.length > 50)) {
      return res.status(400).json({ ok: false, error: 'Invalid history format.' });
    }

    const safeHistory = Array.isArray(history) ? history : [];
    const contents = safeHistory
      .filter((m, i) => !(i === 0 && m.role === 'assistant'))
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.text || '').slice(0, 2000) }],
      }));

    if (contents.length === 0 || contents[contents.length - 1].parts[0].text !== message) {
      contents.push({ role: 'user', parts: [{ text: message }] });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await axios.post(
      endpoint,
      {
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ ok: true, reply: reply ? reply.trim() : '' });
  } catch (error) {
    const errData = error.response?.data?.error?.message || error.message;
    console.error('Chat error:', errData);
    res.status(502).json({ ok: false, error: 'Failed to process chat message.' });
  }
});

// POST /call
app.post('/call', callLimiter, async (req, res) => {
  try {
    const { phone, name, items } = req.body;

    if (!phone || typeof phone !== 'string' || phone.length > 25) {
      return res.status(400).json({ ok: false, error: 'Valid phone number is required.' });
    }

    let cleanPhone = phone.replace(/[\s\-()]/g, '');
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+91${cleanPhone}`;
    }

    if (!/^\+[1-9]\d{9,14}$/.test(cleanPhone)) {
      return res.status(400).json({ ok: false, error: 'Invalid phone number format.' });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
      return res.status(400).json({ ok: false, error: 'Name is required (max 100 characters).' });
    }

    if (!items || typeof items !== 'string' || items.length > 1000) {
      return res.status(400).json({ ok: false, error: 'Items list is required (max 1000 characters).' });
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
      task,
      first_sentence: firstSentence,
      voice: 'maya',
      amd: false,
      wait_for_greeting: false,
      record: false,
      language: 'en-US',
      local_dialing: true,
    };

    const response = await axios.post('https://api.bland.ai/v1/calls', payload, {
      headers: {
        authorization: BLAND_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    res.json({ ok: true, data: response.data });
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error('Bland AI error:', JSON.stringify(errData));
    res.status(500).json({ ok: false, error: errData });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Recipe Vault Backend running on port ${PORT}`);
});
