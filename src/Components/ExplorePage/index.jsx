import { useState, useEffect, useContext, useCallback } from "react";
import { Ctx } from "../../context";
import {
  API, HC, LOAD_CATS, DAYS, MEAL_TYPES, MEAL_ICONS, DELIVERY,
} from "../../config";
import { fmt, getPrice, getIngredientPrice } from "../../helpers";
import { useDebounce } from "../../hooks/useDebounce";
import { fetchIngredientSubstitutes } from "../../services/substitution";

/* ═══════════════════════════
   EXPLORE PAGE  –  Component 2
═══════════════════════════ */
export default function ExplorePage() {
  const { setCartOpen, cart } = useContext(Ctx);
  const [query,   setQuery]   = useState("");
  const [meals,   setMeals]   = useState([]);
  const [cats,    setCats]    = useState([]);
  const [selCat,  setSelCat]  = useState("");
  const [healthy, setHealthy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errMsg,  setErrMsg]  = useState("");
  const dq = useDebounce(query, 380);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const loadDefault = useCallback(async () => {
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
  }, []);

  // Single unified effect keyed on (dq, selCat).
  // Branches: category filter → search → default load (mutually exclusive).
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (selCat) {
        setLoading(true); setErrMsg("");
        try {
          const r = await fetch(`${API}/filter.php?c=${encodeURIComponent(selCat)}`);
          const d = await r.json();
          if (!cancelled) { setMeals(d.meals || []); setLoading(false); }
        } catch {
          if (!cancelled) { setErrMsg("Failed to load category recipes."); setLoading(false); }
        }
      } else if (dq.trim()) {
        setLoading(true); setErrMsg("");
        try {
          const r = await fetch(`${API}/search.php?s=${encodeURIComponent(dq)}`);
          const d = await r.json();
          if (!cancelled) { setMeals(d.meals || []); setLoading(false); }
        } catch {
          if (!cancelled) { setErrMsg("Search failed."); setLoading(false); }
        }
      } else {
        await loadDefault();
      }
    };

    run();
    return () => { cancelled = true; };
  }, [dq, selCat, loadDefault]);

  useEffect(() => {
    fetch(`${API}/categories.php`).then(r => r.json())
      .then(d => setCats(d.categories || [])).catch(() => {});
  }, []);

  const display = healthy ? meals.filter(m => !m.strCategory || HC.includes(m.strCategory)) : meals;

  return (
    <div>
      <section className="hero">
        <p className="eyebrow">🥗 1,000+ Healthy Recipes</p>
        <h1 className="hero-h1">Discover meals that<br /><em>nourish your body</em></h1>
        <p className="hero-p">Add dishes to your cart · order together · email confirmation · Hyderabad delivery.</p>

        {cartCount > 0 && (
          <button className="explore-cart-bar" onClick={() => setCartOpen(true)} aria-label={`${cartCount} item${cartCount !== 1 ? 's' : ''} in cart, click to view`}>
            <span className="ecb-left">🛒 <strong>{cartCount} item{cartCount !== 1 ? "s" : ""}</strong> in your cart</span>
            <span className="ecb-right">View Cart →</span>
          </button>
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

  /* ── Ingredient Substitution States (Option A) ── */
  const [subModalIng, setSubModalIng] = useState(null);
  const [substitutes, setSubstitutes] = useState([]);
  const [subLoading, setSubLoading] = useState(false);
  const [activeDietFilter, setActiveDietFilter] = useState("All");
  const [swappedIngs, setSwappedIngs] = useState({});
  const [subFlash, setSubFlash] = useState("");

  useEffect(() => {
    const fetchMeal = async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API}/lookup.php?i=${mealId}`);
        const d = await r.json();
        setMeal(d.meals?.[0] || null); setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    fetchMeal();
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

  /* ── Substitution Handlers (Option A) ── */
  const openSubstitutes = async (ing) => {
    setSubModalIng(ing);
    setSubLoading(true);
    setActiveDietFilter("All");
    try {
      const subs = await fetchIngredientSubstitutes(ing.n);
      setSubstitutes(subs || []);
    } catch {
      setSubstitutes([]);
    } finally {
      setSubLoading(false);
    }
  };

  const applySwapToRecipe = (sub) => {
    if (!subModalIng) return;
    setSwappedIngs((prev) => ({
      ...prev,
      [subModalIng.n]: { substitute: sub.substitute, ratio: sub.ratio },
    }));
    setSubModalIng(null);
  };

  const addSubstituteToCart = (sub) => {
    if (!subModalIng) return;
    const subPrice = getIngredientPrice(sub.substitute);
    const subMeal = {
      idMeal: `sub_${meal.idMeal}_${sub.substitute.replace(/\s+/g, "_").toLowerCase()}`,
      strMeal: `${sub.substitute} (Sub for ${subModalIng.n})`,
      strMealThumb: `https://www.themealdb.com/images/ingredients/${encodeURIComponent(sub.substitute)}.png`,
      strCategory: "Ingredient",
      price: subPrice,
    };
    addToCart(subMeal);
    setSubFlash(sub.substitute);
    setTimeout(() => setSubFlash(""), 2200);
  };

  const filteredSubstitutes = substitutes.filter((s) => {
    if (activeDietFilter === "All") return true;
    return s.dietary?.some((d) => d.toLowerCase().includes(activeDietFilter.toLowerCase()));
  });

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
            <button className="detail-in-cart-bar" onClick={() => setCartOpen(true)} aria-label="View cart">
              🛒 <strong>{cartItem.qty}×</strong> already in your cart —{" "}
              <span className="dicb-link">View Cart →</span>
            </button>
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
            <div className="ing-sub-banner">
              <span>💡</span>
              <span>Missing an ingredient? Tap <strong>⇄</strong> on any item to view curated rule & embedding substitutions.</span>
            </div>
            <div className="ing-grid">
              {ings.map(({ n, m }, i) => {
                const flashed  = !!ingFlash[n];
                const swap = swappedIngs[n];
                const displayName = swap ? swap.substitute : n;
                const displayMeasure = swap ? swap.ratio : m;
                const ingPrice = getIngredientPrice(displayName);
                return (
                  <div key={i} className={`ing-chip ing-chip-orderable${flashed ? " ing-chip-flashed" : ""}${swap ? " ing-chip-swapped" : ""}`}>
                    <img
                      src={`https://www.themealdb.com/images/ingredients/${encodeURIComponent(displayName)}-Small.png`}
                      alt={displayName} className="ing-img"
                      onError={e => { e.target.style.display = "none"; }} />
                    <div className="ing-text">
                      <span className="ing-name">
                        {displayName}
                        {swap && <span className="ing-swap-indicator"> (⇄ {n})</span>}
                      </span>
                      {displayMeasure && <span className="ing-measure">{displayMeasure}</span>}
                      <span className="ing-price-tag">{fmt(ingPrice)}</span>
                    </div>
                    <div className="ing-actions-group">
                      <button
                        type="button"
                        className="ing-sub-btn"
                        onClick={() => openSubstitutes({ n, m })}
                        title={`Find substitutes for ${n}`}
                        aria-label={`Find substitutes for ${n}`}>
                        ⇄
                      </button>
                      <button
                        type="button"
                        className={`ing-add-btn${flashed ? " ing-add-btn-done" : ""}`}
                        onClick={() => addIngredientToCart({ n: displayName, m: displayMeasure })}
                        title={`Add ${displayName} to cart`}
                        aria-label={`Add ${displayName} to cart`}>
                        {flashed ? "✓" : "🛒"}
                      </button>
                    </div>
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

      {/* ── Substitution Modal (Option A) ── */}
      {subModalIng && (
        <div className="sub-modal-backdrop" onClick={() => setSubModalIng(null)}>
          <div className="sub-modal-card" onClick={e => e.stopPropagation()}>
            <div className="sub-modal-header">
              <div className="sub-modal-header-left">
                <img
                  src={`https://www.themealdb.com/images/ingredients/${encodeURIComponent(subModalIng.n)}-Small.png`}
                  alt={subModalIng.n}
                  className="sub-modal-source-img"
                  onError={e => { e.target.style.display = "none"; }}
                />
                <div>
                  <div className="sub-modal-tagline">Ingredient Substitution (Option A)</div>
                  <h2 className="sub-modal-title">Substitutes for {subModalIng.n}</h2>
                  {subModalIng.m && (
                    <p className="sub-modal-source-measure">
                      Recipe quantity: <strong>{subModalIng.m}</strong>
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="sub-modal-close"
                onClick={() => setSubModalIng(null)}
                aria-label="Close substitutes modal"
              >
                ✕
              </button>
            </div>

            <div className="sub-modal-info-banner">
              <span>💡</span>
              <span>
                Suggestions powered by <strong>curated culinary rules</strong> (e.g. butter → olive oil) +{" "}
                <strong>12D ingredient vector embeddings</strong> (cosine similarity).
              </span>
            </div>

            <div className="sub-diet-filters">
              {["All", "Vegan", "Dairy-Free", "Gluten-Free", "High-Protein", "Low-Carb", "Keto"].map(f => (
                <button
                  key={f}
                  type="button"
                  className={`sub-diet-pill${activeDietFilter === f ? " sub-diet-pill-on" : ""}`}
                  onClick={() => setActiveDietFilter(f)}
                  aria-pressed={activeDietFilter === f}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="sub-list">
              {subLoading ? (
                <div className="sub-loading">
                  <div className="spinner" />
                </div>
              ) : filteredSubstitutes.length === 0 ? (
                <div className="sub-empty">No substitutes match the "{activeDietFilter}" filter.</div>
              ) : (
                filteredSubstitutes.map((sub, idx) => {
                  const subPrice = getIngredientPrice(sub.substitute);
                  const isFlashed = subFlash === sub.substitute;
                  const isCurrentlySwapped = swappedIngs[subModalIng.n]?.substitute === sub.substitute;

                  return (
                    <div key={idx} className={`sub-item-card${isCurrentlySwapped ? " sub-item-active-swap" : ""}`}>
                      <div className="sub-item-top">
                        <div className="sub-item-main">
                          <img
                            src={`https://www.themealdb.com/images/ingredients/${encodeURIComponent(sub.substitute)}-Small.png`}
                            alt={sub.substitute}
                            className="sub-item-img"
                            onError={e => { e.target.style.display = "none"; }}
                          />
                          <div>
                            <div className="sub-item-title-row">
                              <h4 className="sub-item-name">{sub.substitute}</h4>
                              <span
                                className={`sub-badge ${
                                  sub.matchType === "Curated Rule" ? "sub-badge-rule" : "sub-badge-embed"
                                }`}
                              >
                                {sub.matchType === "Curated Rule"
                                  ? "⭐ Curated Rule"
                                  : `🧬 Embedding Match (${Math.round((sub.confidence || 0.8) * 100)}%)`}
                              </span>
                            </div>
                            <div className="sub-item-ratio">
                              <span className="sub-ratio-icon">⇄</span>
                              <span><strong>Ratio:</strong> {sub.ratio}</span>
                            </div>
                          </div>
                        </div>
                        <div className="sub-item-price">{fmt(subPrice)}</div>
                      </div>

                      {sub.dietary && sub.dietary.length > 0 && (
                        <div className="sub-diet-badges">
                          {sub.dietary.map(d => (
                            <span key={d} className="sub-diet-badge">✓ {d}</span>
                          ))}
                        </div>
                      )}

                      <p className="sub-item-note">{sub.note}</p>

                      <div className="sub-item-actions">
                        <button
                          type="button"
                          className={`sub-btn-swap${isCurrentlySwapped ? " sub-btn-swapped" : ""}`}
                          onClick={() => applySwapToRecipe(sub)}
                          aria-label={`Swap ${sub.substitute} into recipe`}
                        >
                          {isCurrentlySwapped ? "✓ Active in Recipe" : "⇄ Swap in Recipe"}
                        </button>
                        <button
                          type="button"
                          className={`sub-btn-cart${isFlashed ? " sub-btn-cart-done" : ""}`}
                          onClick={() => addSubstituteToCart(sub)}
                          aria-label={`Add ${sub.substitute} to cart`}
                        >
                          {isFlashed ? "✓ Added to Cart!" : `🛒 Add to Cart (${fmt(subPrice)})`}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}