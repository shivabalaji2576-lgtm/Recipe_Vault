import { useState, useEffect, useContext } from "react";
import "./App.css";

/* ── Shared context, constants, helpers ── */
import { Ctx } from "./context";
import { DAYS, MEAL_TYPES } from "./config";
import { getPrice } from "./helpers";
import { useLocalStorage } from "./hooks/useLocalStorage";
import * as api from "./services/api";
import { placeUserOrder, getTodayMeals } from "./services/orders";


import LoginPage from "./Components/LoginPage";

/* ── Component 2 : Explore + Detail ── */
import ExplorePage, { DetailPage } from "./Components/ExplorePage";


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
   ROOT
───────────────────────────────────── */
export default function App() {
  const [token, setToken] = useLocalStorage("rv_token", null);
  const [auth, setAuth] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(token));

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    api.getMe()
      .then(data => {
        if (!isMounted) return;
        if (data?.user) {
          setAuth(data.user);
        } else {
          setToken(null);
          setAuth(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setToken(null);
          setAuth(null);
        }
      })
      .finally(() => {
        if (isMounted) setAuthLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, setToken]);

  const handleLogin = (u) => {
    setAuth(u);
  };

  const handleLogout = () => {
    setToken(null);
    setAuth(null);
  };

  const handleUpdateAuth = u => {
    setAuth(u);
  };

  if (authLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

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
  const [page, setPage] = useState("home");
  const [detailId, setDetailId] = useState(null);
  const [toast, setToast] = useState(null);
  const [sending, setSending] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [calling] = useState(false);

  const [dataLoading, setDataLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const defaultPlan = Object.fromEntries(
    DAYS.map(d => [d, Object.fromEntries(MEAL_TYPES.map(t => [t, null]))])
  );
  const [mealPlan, setMealPlan] = useState(defaultPlan);
  const [autoOn, setAutoOn] = useState(false);

  const showToast = (msg, type = "success", ms = 4000) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), ms);
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getCart().catch(() => []),
      api.getOrders().catch(() => []),
      api.getMealPlan().catch(() => ({ mealPlan: null, autoOn: false })),
    ]).then(([fetchedCart, fetchedOrders, fetchedPlan]) => {
      if (!isMounted) return;
      if (Array.isArray(fetchedCart)) setCart(fetchedCart);
      if (Array.isArray(fetchedOrders)) setOrderHistory(fetchedOrders);
      if (fetchedPlan?.mealPlan && Object.keys(fetchedPlan.mealPlan).length > 0) {
        setMealPlan(fetchedPlan.mealPlan);
      }
      if (typeof fetchedPlan?.autoOn === "boolean") {
        setAutoOn(fetchedPlan.autoOn);
      }
    }).finally(() => {
      if (isMounted) setDataLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const saveCart = async list => {
    setCart(list);
    try {
      await api.saveCart(list);
    } catch {
      showToast("Failed to save cart to server", "error");
    }
  };

  const saveMealPlan = async plan => {
    setMealPlan(plan);
    try {
      await api.saveMealPlan(plan, autoOn);
    } catch {
      showToast("Failed to save meal plan", "error");
    }
  };

  const saveAutoOn = async val => {
    setAutoOn(val);
    try {
      await api.saveMealPlan(mealPlan, val);
    } catch {
      showToast("Failed to update auto-order setting", "error");
    }
  };

  const nav = (p, id = null) => {
    setPage(p);
    if (id) setDetailId(id);
    window.scrollTo(0, 0);
  };

  const addToCart = meal => {
    const price = meal.price || getPrice(meal);
    const ex = cart.find(c => c.idMeal === meal.idMeal);
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

    const result = await placeUserOrder({ auth, items: cart });
    if (result.ok && result.order) {
      setOrderHistory(prev => [result.order, ...prev]);
    }
    setSending(false);
    setOrderPlaced(true);

    if (result.orderSaved === false) {
      showToast("Failed to save order to server", "error");
    }

    if (result.callResult && !result.callResult.ok) {
      showToast(`⚠️ AI Call notice: ${result.callResult.msg}`, "info");
    } else if (result.callResult?.ok) {
      showToast("✅ AI Call initiated! Check your phone.", "success");
    }

    if (result.emailResult?.ok) {
      showToast(`✅ Order confirmed! Email sent to ${auth.email}`, "success");
    } else {
      showToast("✅ Order placed!", "success");
    }
  };

  const addToPlanner = (meal, day, type) =>
    saveMealPlan({ ...mealPlan, [day]: { ...mealPlan[day], [type]: meal } });

  const clearSlot = (day, type) =>
    saveMealPlan({ ...mealPlan, [day]: { ...mealPlan[day], [type]: null } });

  const autoOrderToday = async () => {
    const { today, meals } = getTodayMeals(mealPlan);
    if (!meals.length) return false;
    const items = meals.map(m => ({ ...m, price: getPrice(m), qty: 1 }));
    const merged = [...cart];
    items.forEach(m => {
      const ex = merged.find(c => c.idMeal === m.idMeal);
      ex ? (ex.qty += 1) : merged.push(m);
    });
    saveCart(merged);
    setSending(true);
    showToast("📤 Sending email…", "info", 2000);

    const result = await placeUserOrder({ auth, items });
    setSending(false);

    if (result.orderSaved === false) {
      showToast("Failed to save auto-order to server", "error");
    }

    if (result.emailResult?.ok) {
      showToast(`✅ ${meals.length} meal(s) for ${today} added! Email sent`, "success");
    }
    return today;
  };

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const plannedCount = Object.values(mealPlan).reduce(
    (s, d) => s + Object.values(d).filter(Boolean).length, 0
  );

  const ctxValue = {
    auth,
    nav,
    cart,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    cartCount,
    cartOpen,
    setCartOpen,
    orderHistory,
    orderPlaced,
    placeOrder,
    mealPlan,
    addToPlanner,
    clearSlot,
    plannedCount,
    autoOn,
    saveAutoOn,
    autoOrderToday,
    sending,
    calling,
    showToast,
  };

  if (dataLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Ctx.Provider value={ctxValue}>
      <div className="app">

        {toast && (
          <div className={`order-toast toast-${toast.type}`}>
            <span className="toast-icon">
              {toast.type === "success" ? "✅" : toast.type === "info" ? "📤" : toast.type === "error" ? "❌" : "⚠️"}
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
          {page === "home" && <ExplorePage />}
          {page === "detail" && <DetailPage mealId={detailId} />}
          {page === "cart" && <CartPage />}
          {page === "planner" && <PlannerPage />}
          {page === "shopping" && <ShoppingPage />}
          {page === "orders" && <OrdersPage />}
          {page === "map" && <MapPage />}
          {page === "profile" && (
            <ProfilePage
              auth={auth}
              onLogout={onLogout}
              onUpdateAuth={onUpdateAuth}
              orderHistory={orderHistory}
              cart={cart}
              mealPlan={mealPlan}
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
  const { setCartOpen, calling } = useContext(Ctx);

  const tabs = [
    { id: "home", label: "🍽 Explore" },
    { id: "planner", label: "📅 Planner", badge: plannedCount },
    { id: "shopping", label: "🛒 Shopping" },
    { id: "orders", label: "📋 Orders" },
    { id: "map", label: "🗺️ Map" },
    { id: "profile", label: "👤 Profile" },
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
              {Boolean(t.badge) && <span className="nav-badge">{t.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="hdr-actions">
          <button className="btn-cart-nav" onClick={() => setCartOpen(true)}>
            🛒 <span className="cart-badge">{cartCount}</span>
          </button>
          {calling && (
            <span className="hdr-calling-indicator" title="AI Call in progress">
              <span className="calling-dot" /> 📞 Calling...
            </span>
          )}
          <span className="hdr-user-chip">
            🌿 {auth.name.split(" ")[0]}
          </span>
          <button className="btn-logout" onClick={onLogout} title="Sign Out">
            ↪
          </button>
        </div>

      </div>
    </header>
  );
}