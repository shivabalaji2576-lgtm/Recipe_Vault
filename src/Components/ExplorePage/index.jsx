import { useState, useEffect, useContext } from "react";
import {
  Ctx, API, HC, LOAD_CATS, DAYS, MEAL_TYPES, MEAL_ICONS,
  DELIVERY, fmt, getPrice, getIngredientPrice, useDebounce,
} from "../constants";

/* ═══════════════════════════
   EXPLORE PAGE  –  Component 2
═══════════════════════════ */
export default function ExplorePage() {
  const { nav, setCartOpen, cart } = useContext(Ctx);
  const [query,   setQuery]   = useState("");
  const [meals,   setMeals]   = useState([]);
  const [cats,    setCats]    = useState([]);
  const [selCat,  setSelCat]  = useState("");
  const [healthy, setHealthy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errMsg,  setErrMsg]  = useState("");
  const dq = useDebounce(query, 380);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const loadDefault = async () => {
    setLoading(true); setErrMsg("");
    try {
      const all = await Promise.all(
        LOAD_CATS.map(c =>
          fetch(`${API}/filter.php?c=${c}`).then(r => r.json())
            .then(d => (d.meals || []).slice(0, 6)).catch(() => [])
        )
      );
      const combined = all.flat();
      if (!combined.length) setErrMsg("Could not load recipes. Check internet.");
      setMeals(combined);
    } catch { setErrMsg("Failed to load recipes."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadDefault();
    fetch(`${API}/categories.php`).then(r => r.json())
      .then(d => setCats(d.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!dq.trim()) { if (!selCat) loadDefault(); return; }
    setLoading(true); setErrMsg("");
    fetch(`${API}/search.php?s=${encodeURIComponent(dq)}`)
      .then(r => r.json())
      .then(d => { setMeals(d.meals || []); setLoading(false); })
      .catch(() => { setErrMsg("Search failed."); setLoading(false); });
  }, [dq]);

  useEffect(() => {
    if (!selCat) { if (!query) loadDefault(); return; }
    setLoading(true);
    fetch(`${API}/filter.php?c=${encodeURIComponent(selCat)}`)
      .then(r => r.json())
      .then(d => { setMeals(d.meals || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selCat]);

  const display = healthy ? meals.filter(m => !m.strCategory || HC.includes(m.strCategory)) : meals;

  return (
    <div>
      <section className="hero">
        <p className="eyebrow">🥗 1,000+ Healthy Recipes</p>
        <h1 className="hero-h1">Discover meals that<br /><em>nourish your body</em></h1>
        <p className="hero-p">Add dishes to your cart · order together · email confirmation · Hyderabad delivery.</p>

        {cartCount > 0 && (
          <div className="explore-cart-bar" onClick={() => setCartOpen(true)}>
            <span className="ecb-left">🛒 <strong>{cartCount} item{cartCount !== 1 ? "s" : ""}</strong> in your cart</span>
            <span className="ecb-right">View Cart →</span>
          </div>
        )}

        <div className="search-box">
          <span className="search-icon">⌕</span>
          <input className="search-input"
            placeholder="Try biryani, chicken, pasta, salad…"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelCat(""); }} />
          {query && <button className="search-clear" onClick={() => setQuery("")}>×</button>}
        </div>

        <div className="filter-bar">
          <select className="filter-select" value={selCat}
            onChange={e => { setSelCat(e.target.value); setQuery(""); }}>
            <option value="">All Categories</option>
            {cats.map(c => <option key={c.idCategory} value={c.strCategory}>{c.strCategory}</option>)}
          </select>
          <button className={`healthy-toggle${healthy ? " healthy-toggle-on" : ""}`}
            onClick={() => setHealthy(p => !p)}>
            {healthy ? "✓ Healthy Only" : "🥗 Healthy Only"}
          </button>
          {(query || selCat) && (
            <button className="filter-clear" onClick={() => { setQuery(""); setSelCat(""); }}>✕ Clear</button>
          )}
        </div>
      </section>

      <section>
        <div className="section-header">
          <h2 className="section-title">
            {(query || selCat)
              ? `${display.length} result${display.length !== 1 ? "s" : ""}`
              : healthy ? "Healthy Picks" : "All Recipes"}
          </h2>
          {!(query || selCat) && <button className="reload-btn" onClick={loadDefault}>↻ Refresh</button>}
        </div>
        {errMsg && <div className="error-box">{errMsg}</div>}
        {loading
          ? <div className="recipe-grid">{[...Array(12)].map((_, i) => <div key={i} className="recipe-skeleton" />)}</div>
          : display.length === 0
            ? <div className="no-results">No recipes found — try a different term.</div>
            : <div className="recipe-grid">{display.map(m => <RecipeCard key={m.idMeal} meal={m} />)}</div>
        }
      </section>
    </div>
  );
}

/* ── Recipe Card ── */
export function RecipeCard({ meal }) {
  const { nav, addToPlanner, addToCart, cart, setCartOpen } = useContext(Ctx);
  const [planOpen,  setPlanOpen]  = useState(false);
  const [selDay,    setSelDay]    = useState("");
  const [selType,   setSelType]   = useState("");
  const [flash,     setFlash]     = useState("");
  const [imgOk,     setImgOk]     = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const isH      = HC.includes(meal.strCategory);
  const price    = getPrice(meal);
  const cartItem = cart.find(c => c.idMeal === meal.idMeal);
  const inCart   = !!cartItem;

  const doAddToCart = e => {
    e.stopPropagation();
    addToCart(meal);
    setFlash("cart");
    setTimeout(() => setFlash(""), 2200);
  };

  const doPlan = e => {
    e.stopPropagation();
    if (!selDay || !selType) return;
    addToPlanner(meal, selDay, selType);
    setPlanOpen(false); setSelDay(""); setSelType("");
    setFlash("plan"); setTimeout(() => setFlash(""), 2000);
  };

  return (
    <div className="recipe-card" onClick={() => nav("detail", meal.idMeal)}>
      <div className="recipe-photo-wrap">
        {imgOk ? (
          <img src={meal.strMealThumb} alt={meal.strMeal} className="recipe-photo" loading="lazy"
            onLoad={() => setImgLoaded(true)} onError={() => setImgOk(false)}
            style={{ opacity: imgLoaded ? 1 : 0 }} />
        ) : (
          <div className="recipe-photo-fallback"><span>🍽️</span><span>{meal.strMeal.slice(0, 20)}</span></div>
        )}
        {!imgLoaded && imgOk && <div className="photo-loader"><div className="spinner" /></div>}
        {isH && <span className="badge-healthy">🥗 Healthy</span>}
        {meal.strCategory && <span className="badge-category">{meal.strCategory}</span>}
        {inCart && (
          <button className="rc-incart-pill" onClick={e => { e.stopPropagation(); setCartOpen(true); }}>
            🛒 {cartItem.qty} in cart · tap to view
          </button>
        )}
        {flash === "cart" && <div className="card-flash rc-flash-cart">🛒 Added to cart!</div>}
        {flash === "plan" && <div className="card-flash flash-plan">📅 Added to planner!</div>}
      </div>

      <div className="recipe-text">
        <h3 className="recipe-name">{meal.strMeal}</h3>
        {meal.strCategory && <p className="recipe-cuisine">{meal.strCategory}{isH ? " · Healthy" : ""}</p>}
        <p className="recipe-price">{fmt(price)}</p>
      </div>

      <div className="recipe-buttons" onClick={e => e.stopPropagation()}>
        <div className="plan-dropdown-wrap">
          <button className="btn-plan" onClick={e => { e.stopPropagation(); setPlanOpen(p => !p); }}>📅 Plan</button>
          {planOpen && (
            <div className="plan-popup" onClick={e => e.stopPropagation()}>
              <span className="pp-label">Choose Day</span>
              <div className="pp-days">
                {DAYS.map(d => (
                  <button key={d} className={`pp-day${selDay === d ? " pp-day-on" : ""}`}
                    onClick={() => setSelDay(d)}>{d.slice(0, 3)}</button>
                ))}
              </div>
              <span className="pp-label" style={{ marginTop: 10 }}>Meal Type</span>
              <div className="pp-types">
                {MEAL_TYPES.map(t => (
                  <button key={t} className={`pp-type${selType === t ? " pp-type-on" : ""}`}
                    onClick={() => setSelType(t)}>{MEAL_ICONS[t]} {t}</button>
                ))}
              </div>
              <button className="pp-add-btn" onClick={doPlan} disabled={!selDay || !selType}>
                ✓ Add to Planner
              </button>
            </div>
          )}
        </div>
        <button className={`btn-atc${inCart ? " btn-atc-active" : ""}`} onClick={doAddToCart}>
          {inCart ? `✓ Add More (${cartItem.qty})` : "🛒 Add to Cart"}
        </button>
      </div>
    </div>
  );
}

/* ── Detail Page ── */
export function DetailPage({ mealId }) {
  const { nav, addToPlanner, addToCart, cart, setCartOpen } = useContext(Ctx);
  const [meal,     setMeal]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [planOpen, setPlanOpen] = useState(false);
  const [selDay,   setSelDay]   = useState("");
  const [selType,  setSelType]  = useState("");
  const [flash,    setFlash]    = useState("");
  const [ingFlash, setIngFlash] = useState({});

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/lookup.php?i=${mealId}`)
      .then(r => r.json())
      .then(d => { setMeal(d.meals?.[0] || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [mealId]);

  if (loading) return <div className="center-loader"><div className="spinner" /></div>;
  if (!meal)   return <div className="no-results">Recipe not found.</div>;

  const ings = [];
  for (let i = 1; i <= 20; i++) {
    const n = meal[`strIngredient${i}`]?.trim();
    const m = meal[`strMeasure${i}`]?.trim();
    if (n) ings.push({ n, m });
  }

  const ytId    = meal.strYoutube?.includes("v=") ? meal.strYoutube.split("v=")[1] : null;
  const isH     = HC.includes(meal.strCategory);
  const price   = getPrice(meal);
  const cartItem= cart.find(c => c.idMeal === meal.idMeal);

  const doPlan = () => {
    if (!selDay || !selType) return;
    addToPlanner(meal, selDay, selType);
    setPlanOpen(false); setSelDay(""); setSelType("");
    setFlash("plan"); setTimeout(() => setFlash(""), 2000);
  };

  const doAdd = () => {
    addToCart(meal);
    setFlash("cart"); setTimeout(() => setFlash(""), 2500);
  };

  const addIngredientToCart = ing => {
    const ingPrice = getIngredientPrice(ing.n);
    const ingMeal  = {
      idMeal: `ing_${meal.idMeal}_${ing.n.replace(/\s+/g, "_").toLowerCase()}`,
      strMeal: `${ing.n}${ing.m ? ` (${ing.m})` : ""}`,
      strMealThumb: `https://www.themealdb.com/images/ingredients/${encodeURIComponent(ing.n)}.png`,
      strCategory: "Ingredient",
      price: ingPrice,
    };
    addToCart(ingMeal);
    setIngFlash(p => ({ ...p, [ing.n]: true }));
    setTimeout(() => setIngFlash(p => ({ ...p, [ing.n]: false })), 2200);
  };

  const addAllIngredients = () => {
    ings.forEach(ing => addIngredientToCart(ing));
    setTimeout(() => setCartOpen(true), 350);
  };

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={() => nav("home")}>← Back to Explore</button>
      <div className="detail-grid">
        {/* Left */}
        <div className="detail-left">
          <div className="detail-img-wrap">
            <img src={meal.strMealThumb} alt={meal.strMeal} className="detail-img"
              onError={e => { e.target.src = "https://placehold.co/600x450/e8f5e8/2a7040?text=Recipe"; }} />
          </div>
          {ytId && (
            <div className="yt-box">
              <p className="yt-label">▶ Watch Recipe Video</p>
              <div className="yt-frame-wrap">
                <iframe src={`https://www.youtube.com/embed/${ytId}`}
                  allowFullScreen title="Recipe Video" className="yt-frame" />
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="detail-right">
          <div className="detail-tags">
            {isH && <span className="tag tag-green">🥗 Healthy</span>}
            {meal.strCategory && <span className="tag tag-orange">{meal.strCategory}</span>}
            {meal.strArea     && <span className="tag tag-blue">🌍 {meal.strArea}</span>}
          </div>
          <h1 className="detail-title">{meal.strMeal}</h1>
          <p className="detail-price">{fmt(price)} <span className="detail-delivery">+ {fmt(DELIVERY)} delivery</span></p>

          {cartItem && (
            <div className="detail-in-cart-bar" onClick={() => setCartOpen(true)}>
              🛒 <strong>{cartItem.qty}×</strong> already in your cart —{" "}
              <span className="dicb-link">View Cart →</span>
            </div>
          )}

          <div className="detail-actions">
            <div className="plan-dropdown-wrap">
              <button className="detail-btn-plan" onClick={() => setPlanOpen(p => !p)}>📅 Add to Planner</button>
              {planOpen && (
                <div className="plan-popup plan-popup-lg" onClick={e => e.stopPropagation()}>
                  <span className="pp-label">Choose Day</span>
                  <div className="pp-days">
                    {DAYS.map(d => (
                      <button key={d} className={`pp-day${selDay === d ? " pp-day-on" : ""}`}
                        onClick={() => setSelDay(d)}>{d.slice(0, 3)}</button>
                    ))}
                  </div>
                  <span className="pp-label" style={{ marginTop: 12 }}>Meal Type</span>
                  <div className="pp-types">
                    {MEAL_TYPES.map(t => (
                      <button key={t} className={`pp-type${selType === t ? " pp-type-on" : ""}`}
                        onClick={() => setSelType(t)}>{MEAL_ICONS[t]} {t}</button>
                    ))}
                  </div>
                  <button className="pp-add-btn" onClick={doPlan} disabled={!selDay || !selType}>
                    ✓ Add to Planner
                  </button>
                </div>
              )}
            </div>
            <button className={`detail-btn-order${cartItem ? " detail-btn-added" : ""}`} onClick={doAdd}>
              {cartItem ? `🛒 Add More (${cartItem.qty} in cart)` : "🛒 Add to Cart"}
            </button>
          </div>

          {flash === "plan" && <p className="flash-msg flash-green">✓ Added to planner!</p>}
          {flash === "cart" && (
            <p className="flash-msg flash-green">
              🛒 Added to cart!{" "}
              <button className="inline-link" onClick={() => setCartOpen(true)}>View Cart →</button>
            </p>
          )}

          {/* Ingredients panel */}
          <div className="ingredients-panel">
            <div className="ing-panel-header">
              <h3 className="ing-title">Ingredients <span className="ing-count">({ings.length} items)</span></h3>
              <button className="ing-order-all-btn" onClick={addAllIngredients}>🛒 Order All Ingredients</button>
            </div>
            <div className="ing-grid">
              {ings.map(({ n, m }, i) => {
                const flashed  = !!ingFlash[n];
                const ingPrice = getIngredientPrice(n);
                return (
                  <div key={i} className={`ing-chip ing-chip-orderable${flashed ? " ing-chip-flashed" : ""}`}>
                    <img
                      src={`https://www.themealdb.com/images/ingredients/${encodeURIComponent(n)}-Small.png`}
                      alt={n} className="ing-img"
                      onError={e => { e.target.style.display = "none"; }} />
                    <div className="ing-text">
                      <span className="ing-name">{n}</span>
                      {m && <span className="ing-measure">{m}</span>}
                      <span className="ing-price-tag">{fmt(ingPrice)}</span>
                    </div>
                    <button
                      className={`ing-add-btn${flashed ? " ing-add-btn-done" : ""}`}
                      onClick={() => addIngredientToCart({ n, m })}
                      title={`Add ${n} to cart`}>
                      {flashed ? "✓" : "🛒"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="instructions-section">
        <h2 className="section-title">Instructions</h2>
        <div className="instructions-list">
          {meal.strInstructions?.split(/\r?\n+/).filter(p => p.trim()).map((p, i) => (
            <div key={i} className="instruction-step">
              <span className="step-number">{i + 1}</span>
              <p className="step-text">{p}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}