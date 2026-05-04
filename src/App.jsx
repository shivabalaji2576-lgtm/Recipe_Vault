import { useState, useContext } from "react";
import "./App.css";

/* ── Shared context, constants, helpers ── */
import {
  Ctx,
  DAYS, MEAL_TYPES, DELIVERY,
  getPrice, buildOrderEmail, sendDirectEmail,
} from "./Components/constants";

/* ── Component 1 : Login ── */
import LoginPage from "./Components/LoginPage";

/* ── Component 2 : Explore + Detail ── */
import ExplorePage, { DetailPage } from "./Components/ExplorePage";

/* ── Component 3 : Planner + Shopping ── */
import PlannerPage, { ShoppingPage } from "./Components/PlannerShoppingPage";

/* ── Component 4 : Orders ── */
import OrdersPage from "./Components/OrdersPage";

/* ── Component 5 : Map ── */
import MapPage from "./Components/MapPage";

/* ── Component 6 : Profile ── */
import ProfilePage from "./Components/ProfilePage";

/* ── Component 7 : Cart Page + Cart Drawer ── */
import CartPage, { CartDrawer } from "./Components/CartPage";

/* ── Component 8 : ChatBot ── */
import ChatBot from "./Components/ChatBot";

/* ─────────────────────────────────────
   HELPERS
───────────────────────────────────── */
const USER_KEYS = [
  "rv_cart", "rv_order_history", "rv_mealplan",
  "rv_autoon", "rv_addresses", "rv_default_addr", "rv_city",
];

function clearUserData() {
  USER_KEYS.forEach(k => localStorage.removeItem(k));
}

/* ─────────────────────────────────────
   ROOT
───────────────────────────────────── */
export default function App() {
  const [auth, setAuth] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rv_auth")) || null; }
    catch { return null; }
  });

  const handleLogin = u => {
    const prev = localStorage.getItem("rv_current_user");
    if (prev && prev !== u.email) clearUserData();
    localStorage.setItem("rv_current_user", u.email);
    localStorage.setItem("rv_auth", JSON.stringify(u));
    setAuth(u);
  };

  const handleLogout = () => {
    localStorage.removeItem("rv_auth");
    setAuth(null);
  };

  const handleUpdateAuth = u => {
    localStorage.setItem("rv_auth", JSON.stringify(u));
    localStorage.setItem("rv_current_user", u.email);
    setAuth(u);
  };

  if (!auth) return <LoginPage onLogin={handleLogin} />;

  return (
    <MainApp
      auth={auth}
      onLogout={handleLogout}
      onUpdateAuth={handleUpdateAuth}
    />
  );
}

/* ─────────────────────────────────────
   MAIN APP
───────────────────────────────────── */
function MainApp({ auth, onLogout, onUpdateAuth }) {
  const [page,        setPage]        = useState("home");
  const [detailId,    setDetailId]    = useState(null);
  const [toast,       setToast]       = useState(null);
  const [sending,     setSending]     = useState(false);
  const [cartOpen,    setCartOpen]    = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rv_cart")) || []; }
    catch { return []; }
  });
  const saveCart = list => {
    setCart(list);
    try { localStorage.setItem("rv_cart", JSON.stringify(list)); } catch {}
  };

  const [orderHistory, setOrderHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rv_order_history")) || []; }
    catch { return []; }
  });
  const saveHistory = list => {
    setOrderHistory(list);
    try { localStorage.setItem("rv_order_history", JSON.stringify(list)); } catch {}
  };

  const [mealPlan, setMealPlan] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem("rv_mealplan"));
      if (s) return s;
    } catch {}
    return Object.fromEntries(
      DAYS.map(d => [d, Object.fromEntries(MEAL_TYPES.map(t => [t, null]))])
    );
  });
  const saveMealPlan = plan => {
    setMealPlan(plan);
    try { localStorage.setItem("rv_mealplan", JSON.stringify(plan)); } catch {}
  };

  const [autoOn, setAutoOn] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rv_autoon")) ?? false; }
    catch { return false; }
  });
  const saveAutoOn = val => {
    setAutoOn(val);
    try { localStorage.setItem("rv_autoon", JSON.stringify(val)); } catch {}
  };

  const showToast = (msg, type = "success", ms = 4000) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), ms);
  };

  const nav = (p, id = null) => {
    setPage(p);
    if (id) setDetailId(id);
    window.scrollTo(0, 0);
  };

  const addToCart = meal => {
    const price = meal.price || getPrice(meal);
    const ex    = cart.find(c => c.idMeal === meal.idMeal);
    saveCart(
      ex
        ? cart.map(c => c.idMeal === meal.idMeal ? { ...c, qty: c.qty + 1 } : c)
        : [...cart, { ...meal, price, qty: 1 }]
    );
    setCartOpen(true);
  };

  const removeFromCart = id => saveCart(cart.filter(c => c.idMeal !== id));

  const updateQty = (id, delta) =>
    saveCart(cart.map(c => c.idMeal === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c));

  const clearCart = () => { saveCart([]); setOrderPlaced(false); };

  const placeOrder = async () => {
    if (!cart.length) return;
    setSending(true);
    showToast("📤 Sending confirmation email…", "info", 2500);
    const { subject, body } = buildOrderEmail(auth, cart);
    const result = await sendDirectEmail(auth.email, auth.name, subject, body);
    const total  = cart.reduce((s, c) => s + c.qty * (c.price || getPrice(c)), 0) + DELIVERY;
    saveHistory([
      ...orderHistory,
      { id: `ord_${Date.now()}`, items: [...cart], total, date: new Date().toISOString() },
    ]);
    setSending(false);
    setOrderPlaced(true);
    result.ok
      ? showToast(`✅ Order confirmed! Email sent to ${auth.email}`, "success")
      : showToast("✅ Order placed! (Configure EmailJS for email)", "success");
  };

  const addToPlanner = (meal, day, type) =>
    saveMealPlan({ ...mealPlan, [day]: { ...mealPlan[day], [type]: meal } });

  const clearSlot = (day, type) =>
    saveMealPlan({ ...mealPlan, [day]: { ...mealPlan[day], [type]: null } });

  const autoOrderToday = async () => {
    const di    = new Date().getDay();
    const today = DAYS[di === 0 ? 6 : di - 1];
    const meals = Object.values(mealPlan[today]).filter(Boolean);
    if (!meals.length) return false;
    const items  = meals.map(m => ({ ...m, price: getPrice(m), qty: 1 }));
    const merged = [...cart];
    items.forEach(m => {
      const ex = merged.find(c => c.idMeal === m.idMeal);
      ex ? (ex.qty += 1) : merged.push(m);
    });
    saveCart(merged);
    setSending(true);
    showToast("📤 Sending email…", "info", 2000);
    const { subject, body } = buildOrderEmail(auth, items);
    const result = await sendDirectEmail(auth.email, auth.name, subject, body);
    setSending(false);
    if (result.ok) showToast(`✅ ${meals.length} meal(s) for ${today} added! Email sent`, "success");
    return today;
  };

  const cartCount    = cart.reduce((s, c) => s + c.qty, 0);
  const plannedCount = Object.values(mealPlan).reduce(
    (s, d) => s + Object.values(d).filter(Boolean).length, 0
  );

  const ctxValue = {
    auth,
    nav,
    mealPlan, addToPlanner, clearSlot,
    cart, addToCart, removeFromCart, updateQty, clearCart,
    placeOrder, orderPlaced, setOrderPlaced,
    orderHistory,
    autoOn, setAutoOn: saveAutoOn, autoOrderToday,
    showToast, sending,
    cartOpen, setCartOpen,
  };

  return (
    <Ctx.Provider value={ctxValue}>
      <div className="app">

        {toast && (
          <div className={`order-toast toast-${toast.type}`}>
            <span className="toast-icon">
              {toast.type === "success" ? "✅" : toast.type === "info" ? "📤" : "⚠️"}
            </span>
            <span className="toast-msg">{toast.msg}</span>
          </div>
        )}

        <AppHeader
          page={page}
          nav={nav}
          cartCount={cartCount}
          plannedCount={plannedCount}
          auth={auth}
          onLogout={onLogout}
        />

        <main className="main">
          {page === "home"     && <ExplorePage />}
          {page === "detail"   && <DetailPage mealId={detailId} />}
          {page === "cart"     && <CartPage />}
          {page === "planner"  && <PlannerPage />}
          {page === "shopping" && <ShoppingPage />}
          {page === "orders"   && <OrdersPage />}
          {page === "map"      && <MapPage />}
          {page === "profile"  && (
            <ProfilePage
              auth={auth}
              onLogout={onLogout}
              onUpdateAuth={onUpdateAuth}
            />
          )}
        </main>

        <CartDrawer />
        <ChatBot auth={auth} />

      </div>
    </Ctx.Provider>
  );
}

/* ─────────────────────────────────────
   APP HEADER
───────────────────────────────────── */
function AppHeader({ page, nav, cartCount, plannedCount, auth, onLogout }) {
  const { setCartOpen } = useContext(Ctx);

  const tabs = [
    { id: "home",     label: "🍽 Explore" },
    { id: "planner",  label: "📅 Planner",  badge: plannedCount },
    { id: "shopping", label: "🛒 Shopping" },
    { id: "orders",   label: "📋 Orders" },
    { id: "map",      label: "🗺️ Map" },
    { id: "profile",  label: "👤 Profile" },
  ];

  return (
    <header className="hdr">
      <div className="hdr-inner">

        <button className="hdr-logo" onClick={() => nav("home")}>
          <div className="logo-mk">RV</div>
          <div>
            <span className="logo-name">RecipeVault</span>
            <span className="logo-sub">Hyderabad · Healthy Living</span>
          </div>
        </button>

        <nav className="hdr-nav">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`nav-tab${page === t.id ? " nav-tab-on" : ""}`}
              onClick={() => nav(t.id)}>
              {t.label}
              {t.badge > 0 && <span className="nav-badge">{t.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="hdr-right">
          <button className="hdr-cart-btn" onClick={() => setCartOpen(true)} title="Open Cart">
            <span className="hdr-cart-ico">🛒</span>
            <span className="hdr-cart-txt">Cart</span>
            {cartCount > 0 && <span className="hdr-cart-badge">{cartCount}</span>}
          </button>

          <div className="hdr-user">
            <div className="user-avatar" onClick={() => nav("profile")} style={{ cursor: "pointer" }}>
              {auth.name[0].toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{auth.name}</span>
              <span className="user-email">{auth.email}</span>
            </div>
            <button className="logout-btn" onClick={onLogout}>↩ Out</button>
          </div>
        </div>

      </div>
    </header>
  );
}