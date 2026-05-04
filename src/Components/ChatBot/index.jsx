import { useState, useEffect, useRef } from "react";
import { CHATBOT_READY, GEMINI_API_KEY, GEMINI_MODEL } from "../constants";

/* ═══════════════════════════
   CHATBOT  –  Component 8
═══════════════════════════ */
export default function ChatBot({ auth }) {
  const [open,     setOpen]     = useState(false);
  const [input,    setInput]    = useState("");
  const [messages, setMessages] = useState([{
    role: "assistant",
    text: `Namaste${auth?.name ? " " + auth.name.split(" ")[0] : ""}! 👋 I'm your RecipeVault assistant. Ask me anything about recipes, the cart, meal planning, or Hyderabad food!`,
  }]);
  const [loading, setLoading] = useState(false);
  const [pulse,   setPulse]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 120); }, [open]);

  const triggerPulse = () => { setPulse(true); setTimeout(() => setPulse(false), 2000); };

  /* ── FAQ fallback ── */
  const FAQ = [
    { keywords: ["hi","hello","hey","namaste","good morning","howdy","how are you"], boost: ["hi","hello","namaste"],
      a: `👋 Namaste${auth?.name ? " " + auth.name.split(" ")[0] : ""}! 😊\nI can help with:\n🛒 Cart & ordering\n🍛 Recipe ideas\n📅 Meal planning\n🥗 Nutrition tips\n🗺️ Hyderabad restaurants\n\nWhat would you like?` },
    { keywords: ["cart","add to cart","shopping cart","my cart","view cart","how cart works","cart items"], boost: ["cart","add to cart","shopping cart"],
      a: "🛒 How the Cart works:\n\n1️⃣ In Explore, tap **🛒 Add to Cart** on any recipe card\n2️⃣ A cart drawer slides in from the right automatically\n3️⃣ Adjust quantities with the +/− buttons\n4️⃣ Remove items with the 🗑 button\n5️⃣ Tap **✅ Place Order** to confirm\n\n💡 On the recipe detail page, you can also add individual ingredients or all ingredients at once to your cart!" },
    { keywords: ["how to order","place order","order food","checkout","order all"], boost: ["how to order","place order","checkout"],
      a: "✅ How to order:\n\n1️⃣ Go to Explore\n2️⃣ Tap 🛒 Add to Cart on dishes you want\n3️⃣ Add multiple items — they all go to one cart\n4️⃣ Open cart drawer (top-right button or any card)\n5️⃣ Review items & total\n6️⃣ Tap ✅ Place Order → email sent!\n\n📧 You get a full confirmation email with all items and total." },
    { keywords: ["ingredient","ingredients","order ingredient","buy ingredient"], boost: ["ingredient"],
      a: "🧄 You can order individual ingredients!\n\nOpen any recipe detail page → in the Ingredients panel:\n• Tap 🛒 on any ingredient chip to add just that item\n• Tap **🛒 Order All Ingredients** to add everything at once\n\nEach ingredient has its own price (₹29–₹119) and shows up in your cart separately!" },
    { keywords: ["biryani","biriyani","hyderabadi biryani","chicken biryani","best biryani"], boost: ["biryani"],
      a: "🍛 Hyderabad's pride!\n\n🏆 Best restaurants:\n• Paradise Biryani ⭐4.8 · MG Road\n• Bawarchi ⭐4.5 · RTC Cross Roads\n\n📱 Search 'biryani' in Explore → Add to Cart → order with other dishes!" },
    { keywords: ["breakfast","morning food","breakfast ideas","healthy breakfast"], boost: ["breakfast"],
      a: "🌅 Healthy breakfast:\n• Idli + sambar + chutney\n• Oats upma with vegetables\n• Masala dosa\n• Poha with peanuts\n\n📱 Add to Cart from Explore!" },
    { keywords: ["lunch","afternoon meal","lunch ideas"], boost: ["lunch"],
      a: "☀️ Lunch ideas:\n• Dal rice + vegetable sabzi\n• Brown rice with rajma\n• Chicken salad\n\n📱 Add multiple dishes to cart and order together!" },
    { keywords: ["dinner","evening meal","dinner ideas"], boost: ["dinner"],
      a: "🌙 Dinner ideas:\n• Grilled chicken + vegetables\n• Palak dal + brown rice\n• Fish tikka + mint chutney\n\n💡 Keep dinner lighter than lunch!" },
    { keywords: ["price","cost","how much","delivery charge","delivery fee"], boost: ["price","how much","delivery charge"],
      a: "💰 Pricing:\n• Meals: ₹149 – ₹649 per item\n• Ingredients: ₹29 – ₹119 each\n• Delivery: flat ₹49\n• ETA: 30–45 min · Hyderabad\n\nFull breakdown shown in the cart drawer before you order!" },
    { keywords: ["healthy","nutrition","diet","eat healthy"], boost: ["healthy","nutrition"],
      a: "🥗 Healthy eating tips:\n✅ More: lean proteins, veggies, complex carbs\n❌ Less: fried foods, refined flour, sugary drinks\n\n📱 Use the 🥗 Healthy Only filter in Explore!" },
    { keywords: ["planner","meal plan","weekly plan"], boost: ["planner","meal plan"],
      a: "📅 Meal Planner:\n• Explore → tap 📅 Plan on any recipe\n• Choose day + meal type\n• Planner tab shows your weekly timetable\n🤖 Auto Order Today's Meals adds them all to cart!" },
    { keywords: ["map","restaurant","nearby","near me"], boost: ["map","restaurant"],
      a: "🗺️ Hyderabad Restaurants:\n• Paradise Biryani ⭐4.8\n• Chutneys ⭐4.6\n• Bawarchi ⭐4.5\n• Hotel Shadab ⭐4.7\n\nMap tab → 🛒 Add to Cart from any restaurant!" },
    { keywords: ["profile","address","my account"], boost: ["profile","address"],
      a: "👤 Profile features:\n✏️ Edit name\n📍 Save delivery addresses\n📊 Activity stats\n🔗 Quick links to Cart, Orders, Map\n\nClick 👤 Profile in nav!" },
    { keywords: ["thank","thanks","thank you"], boost: ["thank","thanks"],
      a: "😊 You're welcome! Happy eating! 🍽️" },
    { keywords: ["bye","goodbye","good night"], boost: ["bye"],
      a: "👋 Goodbye! Eat healthy! 🥗" },
  ];

  const getFallback = q => {
    const lq    = q.toLowerCase();
    const words = lq.replace(/[^\w\s]/g, " ").split(/\s+/).filter(w => w.length > 1);
    const hits  = kw => {
      const k = kw.toLowerCase();
      if (lq.includes(k)) return true;
      const kws = k.split(/\s+/);
      if (kws.length > 1) return kws.every(w2 => words.some(w => w.includes(w2) || w2.includes(w)));
      if (k.length >= 4) return words.some(w => w.includes(k) || k.includes(w));
      return false;
    };
    let best = 0, ans = null;
    for (const e of FAQ) {
      let s = 0;
      for (const k of (e.keywords || [])) if (hits(k)) s += 1;
      for (const k of (e.boost    || [])) if (hits(k)) s += 3;
      if (s > best) { best = s; ans = e.a; }
    }
    if (best >= 1) return ans;
    return `🤔 Try asking:\n🛒 "How does the cart work?"\n🍛 "Best biryani in Hyderabad"\n📅 "How do I use the planner?"\n💰 "What is the delivery charge?"\n🧄 "Can I order individual ingredients?"`;
  };

  const SYSTEM_PROMPT = `You are a friendly and helpful food assistant for RecipeVault, a healthy meal delivery app in Hyderabad, India. Help users with:
- Recipes, cooking tips, and ingredient suggestions
- Cart & ordering: users tap "Add to Cart" on recipe cards, a cart drawer slides in from the right, they tap "Place Order" to confirm
- Ingredient ordering: on recipe detail pages, users can add individual ingredients to cart with the 🛒 button on each ingredient chip, or add all ingredients at once with the "Order All Ingredients" button
- Meal planning (Breakfast, Lunch, Dinner for each day of the week)
- Nutrition and healthy eating advice
- Hyderabad cuisine: biryani, haleem, mirchi ka salan, qubani ka meetha, etc.
- Restaurants: Paradise Biryani ⭐4.8, Chutneys ⭐4.6, Bawarchi ⭐4.5, Hotel Shadab ⭐4.7, Eat Street ⭐4.3, Ohri's Dum Pukht ⭐4.4
- Prices: ₹149–₹649 per meal, ₹29–₹119 per ingredient, ₹49 flat delivery, 30–45 min ETA, Hyderabad only
The user's name is ${auth?.name || "there"}. Keep responses concise, warm, and helpful. Use emojis occasionally.`;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const history = [...messages, { role: "user", text }];
    setMessages(history);
    setLoading(true);

    /* Fallback mode (no API key) */
    if (!CHATBOT_READY || GEMINI_API_KEY === "AIzaSyD6iPQtdoMd_nbRijeMKLccgVpJgKihEuk") {
      await new Promise(r => setTimeout(r, 500));
      setMessages(prev => [...prev, { role: "assistant", text: getFallback(text) }]);
      if (!open) triggerPulse();
      setLoading(false);
      return;
    }

    /* Gemini API */
    const contents = history
      .filter((_, i) => !(i === 0 && history[0].role === "assistant"))
      .map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] }));

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg  = errData?.error?.message || `API error ${res.status}`;
        setMessages(prev => [...prev, { role: "assistant", text: `⚠️ ${errMsg}\n\n${getFallback(text)}` }]);
        setLoading(false);
        return;
      }
      const data  = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      setMessages(prev => [...prev, { role: "assistant", text: reply?.trim() || getFallback(text) }]);
      if (!open) triggerPulse();
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: `🌐 Could not reach Gemini. Check your API key or internet.\n\n${getFallback(text)}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  const suggestions = [
    "How does the cart work? 🛒",
    "Best biryani in Hyderabad? 🍛",
    "Can I order ingredients? 🧄",
    "What is the delivery charge?",
    "How do I use the planner? 📅",
  ];

  return (
    <>
      {/* FAB button */}
      <button
        className={`chatbot-fab${pulse ? " chatbot-fab-pulse" : ""}${open ? " chatbot-fab-open" : ""}`}
        onClick={() => setOpen(p => !p)}>
        {open
          ? <span className="chatbot-fab-icon">✕</span>
          : <><span className="chatbot-fab-icon">🤖</span><span className="chatbot-fab-label">Ask me!</span></>}
      </button>

      {/* Panel */}
      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar">🤖</div>
              <div>
                <p className="chatbot-name">RecipeVault Assistant</p>
                <p className="chatbot-status"><span className="chatbot-dot" />Online · Hyderabad</p>
              </div>
            </div>
            <button className="chatbot-close-btn" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chatbot-msg chatbot-msg-${m.role}`}>
                {m.role === "assistant" && <div className="chatbot-msg-avatar">🤖</div>}
                <div className="chatbot-bubble">{m.text}</div>
              </div>
            ))}
            {loading && (
              <div className="chatbot-msg chatbot-msg-assistant">
                <div className="chatbot-msg-avatar">🤖</div>
                <div className="chatbot-bubble chatbot-typing"><span /><span /><span /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length === 1 && (
            <div className="chatbot-suggestions">
              {suggestions.map(s => (
                <button key={s} className="chatbot-chip"
                  onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50); }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="chatbot-input-row">
            <textarea ref={inputRef} className="chatbot-input"
              placeholder="Ask about cart, recipes, ingredients…"
              value={input} rows={1}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey} />
            <button
              className={`chatbot-send-btn${(!input.trim() || loading) ? " chatbot-send-disabled" : ""}`}
              onClick={send} disabled={!input.trim() || loading}>
              {loading ? <span className="chatbot-send-spin">◌</span> : "➤"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}