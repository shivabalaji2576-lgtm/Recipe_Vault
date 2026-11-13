# 🥗 RecipeVault — Hyderabad Edition

> Eat well, live better. A full-stack healthy meal delivery and weekly meal planning platform built for Hyderabad, India.

---

## 📖 Project Overview

**RecipeVault** is a modern, responsive web application that bridges healthy recipe discovery with instant meal and ingredient delivery. Users can browse thousands of recipes, plan breakfast, lunch, and dinner across all 7 days of the week, order individual recipes or missing ingredients, replace ingredients using smart AI vector embeddings and culinary rules, and receive automated voice confirmation calls and detailed email receipts upon ordering.

---

## ✨ Features

- **🥗 1,000+ Curated Healthy Recipes**: Fast search with debounce, category filters (*Vegetarian*, *Vegan*, *Chicken*, *Seafood*), and YouTube cooking video integration.
- **⇄ Ingredient Substitution Engine**:
  - **Curated Culinary Rules**: Instant replacements with exact conversion ratios (e.g., butter $\rightarrow$ olive oil, heavy cream $\rightarrow$ Greek yogurt).
  - **12-Dimensional Vector Embeddings**: Cosine similarity algorithm calculating closest culinary match for any ingredient based on fat, moisture, protein, binding, and cooking utility.
  - **Interactive Recipe Swapping**: Swap missing ingredients directly in the recipe view or add substitutes to your cart with one tap.
- **📅 7-Day Timetable Planner**: Drag-and-plan meals for Breakfast, Lunch, and Dinner. Features **1-Click Auto-Order** for today's planned meals.
- **🛒 Shopping List & Cart Drawer**: Add whole meals or specific recipe ingredients. Dynamic subtotal calculation, flat ₹49 Hyderabad delivery, and mock UPI/card payment checkout.
- **🔒 Real JWT Authentication & SQLite Backend**:
  - Secure `POST /auth/register` and `POST /auth/login`.
  - Passwords hashed with `bcryptjs` (salt rounds 10).
  - SQLite database (`better-sqlite3` with WAL mode) storing users, carts, order history, meal plans, and addresses scoped to the authenticated user.
- **📞 Automated AI Voice Order Confirmation**: Instant automated phone call powered by **Bland AI** confirming ordered items and delivery ETA (30–45 mins).
- **📧 Direct Email Invoicing**: Formatted HTML receipts with itemized pricing sent directly via **EmailJS**.
- **🗺️ Hyderabad Culinary Map**: Interactive map with landmark restaurants across Banjara Hills, Secunderabad, RTC Cross Roads, and Old City.
- **💬 AI Food Assistant**: Integrated chatbot powered by Google Gemini for nutrition tips, meal recommendations, and Hyderabad specialties.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **Styling**: Pure Modular CSS (no Tailwind), custom design system, Fraunces serif + Plus Jakarta Sans typography
- **State Management**: React Context (`Ctx`), custom hooks (`useLocalStorage`, `useDebounce`)
- **Testing**: Vitest + V8 Code Coverage
- **Icons**: Accessible Unicode & ARIA-labeled buttons

### Backend
- **Runtime**: Node.js + Express 5
- **Database**: SQLite via `better-sqlite3` with Write-Ahead Logging (WAL)
- **Security**: JWT (`jsonwebtoken`), password hashing (`bcryptjs`), rate limiting (`express-rate-limit`), CORS whitelist
- **APIs**: Bland AI (Voice Calls), Google Gemini (Conversational AI), TheMealDB (Recipe Database)

---

## 📁 Project Structure

```
Recipe_Vault-main/
├── backend/
│   ├── db.js                 # SQLite schema (users, carts, orders, meal_plans, user_addresses)
│   ├── server.js             # Express REST API & protected route handlers
│   ├── middleware/
│   │   └── auth.js           # JWT Bearer token authentication middleware
│   ├── services/
│   │   └── substitution.js   # 12D vector embeddings & culinary rule engine
│   ├── package.json
│   └── .env.example
├── src/
│   ├── Components/
│   │   ├── AppShell.css
│   │   ├── CartPage/         # Cart drawer, cart page & payment modal
│   │   ├── ChatBot/          # Gemini AI assistant widget
│   │   ├── ExplorePage/      # Recipe discovery, detail view & substitution modal
│   │   ├── LoginPage/        # Sign in & sign up forms
│   │   ├── MapPage/          # Hyderabad culinary restaurant map
│   │   ├── OrdersPage/       # Past order history & receipt records
│   │   ├── PlannerShoppingPage/ # 7-day timetable planner & shopping list
│   │   └── ProfilePage/      # Account settings, phone & address book
│   ├── services/
│   │   ├── api.js            # Centralized API client with JWT bearer header
│   │   ├── email.js          # EmailJS direct email delivery
│   │   ├── orderCall.js      # Bland AI order confirmation trigger
│   │   ├── orders.js         # Order placement & auto-order business logic
│   │   └── substitution.js   # Client substitution service with offline fallback
│   ├── hooks/
│   │   ├── useDebounce.js    # Debounced input hook
│   │   └── useLocalStorage.js# Safe try/catch localStorage hook
│   ├── config.js             # Application constants & environmental flags
│   ├── context.js            # Central application React context
│   ├── helpers.js            # Pure helper utilities (fmt, getPrice, cartTotal)
│   ├── helpers.test.js       # Vitest unit test suite (100% coverage)
│   ├── App.jsx               # Application root & router controller
│   ├── App.css               # Per-component stylesheet imports
│   ├── index.css             # Global tokens, reset, typography & toasts
│   └── main.jsx
├── package.json
└── vite.config.js
```

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)

---

### 1. Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Configure your `.env` variables (see [Environment Variables](#-environment-variables)).
5. Start the backend server:
   ```bash
   npm start
   ```
   *The server runs by default at `http://localhost:5000`.*

---

### 2. Frontend Setup

1. From the project root (`Recipe_Vault-main/`):
   ```bash
   npm install
   ```
2. Create your `.env` file (optional, defaults to `http://localhost:5000` for local backend):
   ```bash
   cp .env.example .env
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## 🧪 Running Unit Tests & Quality Checks

Run the test suite using **Vitest**:
```bash
# Run unit tests once
npm run test:run

# Run unit tests with live code coverage
npm run coverage

# Run ESLint linter
npm run lint

# Build production bundle
npm run build
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed origins | `http://localhost:5173,https://shivabalaji2576-lgtm.github.io` |
| `JWT_SECRET` | Secret key used to sign and verify user JWTs | `your_secure_jwt_secret_here` |
| `BLAND_API_KEY` | Bland AI API key for automated voice calls | `your_bland_api_key` |
| `BLAND_FROM_NUMBER` | Verified caller phone number | `+10000000000` |
| `GEMINI_API_KEY` | Google Gemini API key for chatbot queries | `your_gemini_api_key` |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.0-flash` |

### Frontend (`.env`)

| Variable | Description | Example / Default |
|---|---|---|
| `VITE_BACKEND_URL` | Root URL of the RecipeVault Express API | `http://localhost:5000` |
| `VITE_EMAILJS_SERVICE_ID` | EmailJS Service ID | `service_xxxxxxx` |
| `VITE_EMAILJS_TEMPLATE_ID` | EmailJS Template ID | `template_xxxxxxx` |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS Public API Key | `user_xxxxxxx` |

---

## 📸 Screenshots & UI Walkthrough

| Feature | Preview |
|---|---|
| **Recipe Explorer & Search** | Discover 1,000+ meals with instant healthy filters and search. |
| **Recipe Detail & AI Substitutions** | Detailed view with video, ingredient prices, and smart 12D embedding substitutions. |
| **7-Day Meal Planner** | Interactive timetable for Breakfast, Lunch, and Dinner with 1-click ordering. |
| **Hyderabad Restaurant Map** | Interactive Leaflet map with culinary hotspots and hours. |
| **Cart & Instant Checkout** | Slide-in cart drawer with delivery fees and multi-method payment. |
| **User Profile & Address Book** | Secure saved addresses, contact info, and cloud-synced account data. |

> *Tip: Add your application screenshots to an `assets/` or `public/screenshots/` folder and link them above for public presentations.*

---

## 📄 License
This project is licensed under the ISC License.
