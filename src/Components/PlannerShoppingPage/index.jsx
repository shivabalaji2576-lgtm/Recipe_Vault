import { useState, useEffect, useContext } from "react";
import {
  Ctx, API, DAYS, SHORT, MEAL_TYPES, MEAL_ICONS,
} from "../constants";

/* ═══════════════════════════
   PLANNER PAGE  –  Component 3a
═══════════════════════════ */
export default function PlannerPage() {
  const { nav, mealPlan, clearSlot, autoOn, setAutoOn, autoOrderToday } = useContext(Ctx);
  const [autoMsg, setAutoMsg] = useState("");
  const di        = new Date().getDay();
  const todayName = DAYS[di === 0 ? 6 : di - 1];
  const todayCount= Object.values(mealPlan[todayName]).filter(Boolean).length;
  const planned   = Object.values(mealPlan).reduce((s, d) => s + Object.values(d).filter(Boolean).length, 0);

  const handleAutoOrder = async () => {
    setAutoMsg("📤 Ordering and sending email…");
    const result = await autoOrderToday();
    if (result) {
      setAutoMsg(`✅ ${todayCount} meal(s) for ${result} ordered! Email sent.`);
      setTimeout(() => setAutoMsg(""), 5000);
      nav("cart");
    } else {
      setAutoMsg("⚠ No meals planned for today.");
      setTimeout(() => setAutoMsg(""), 4000);
    }
  };

  return (
    <div className="planner-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Weekly Meal Planner</h1>
          <p className="page-sub">{planned} meal{planned !== 1 ? "s" : ""} planned · today is <strong>{todayName}</strong></p>
        </div>
        <button className="btn-green" onClick={() => nav("shopping")}>🛒 Shopping List</button>
      </div>

      {/* Auto-order card */}
      <div className="auto-order-card">
        <div className="auto-order-left">
          <div className="auto-icon">🤖</div>
          <div>
            <h3 className="auto-title">Auto Daily Order</h3>
            <p className="auto-desc">
              Add all meals for <strong>{todayName}</strong> to cart in one click.{" "}
              {todayCount > 0 ? `${todayCount} meal(s) ready.` : "No meals planned today."}
            </p>
          </div>
        </div>
        <div className="auto-order-right">
          <div className="auto-toggle-row">
            <span className="auto-toggle-label">Auto-Order</span>
            <div className={`auto-toggle${autoOn ? " auto-toggle-on" : ""}`} onClick={() => setAutoOn(!autoOn)}>
              <div className="auto-toggle-thumb" />
            </div>
          </div>
          <button className="auto-order-btn" onClick={handleAutoOrder}>🤖 Order Today's Meals</button>
        </div>
      </div>

      {autoMsg && <div className={`auto-msg${autoMsg.startsWith("⚠") ? " auto-msg-warn" : ""}`}>{autoMsg}</div>}

      <p className="planner-hint">
        Go to <button className="inline-link" onClick={() => nav("home")}>Explore</button> → tap{" "}
        <strong>🛒 Add to Cart</strong> or <strong>📅 Plan</strong>.
      </p>

      {/* Timetable */}
      <div className="timetable-scroll">
        <table className="timetable">
          <thead>
            <tr>
              <th className="tt-th tt-type-th"></th>
              {DAYS.map((d, i) => (
                <th key={d} className={`tt-th${d === todayName ? " tt-today-header" : ""}`}>
                  <span className="tt-day-short">{SHORT[i]}</span>
                  <span className="tt-day-full">{d}</span>
                  {d === todayName && <span className="tt-today-dot">● today</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEAL_TYPES.map(type => (
              <tr key={type} className={`tt-row tt-${type.toLowerCase()}`}>
                <td className="tt-type-cell">
                  <span className="type-icon">{MEAL_ICONS[type]}</span>
                  <span className="type-label">{type}</span>
                </td>
                {DAYS.map(day => {
                  const m = mealPlan[day][type];
                  return (
                    <td key={day} className={`tt-meal-cell${day === todayName ? " tt-today-col" : ""}`}>
                      {m ? (
                        <div className="tt-meal-card" onClick={() => nav("detail", m.idMeal)}>
                          <img src={m.strMealThumb} alt={m.strMeal} className="tt-meal-img"
                            onError={e => { e.target.src = "https://placehold.co/120x72/e8f5e8/2a7040?text=Meal"; }} />
                          <p className="tt-meal-name">{m.strMeal}</p>
                          <button className="tt-remove-btn"
                            onClick={e => { e.stopPropagation(); clearSlot(day, type); }}>×</button>
                        </div>
                      ) : (
                        <div className="tt-empty-slot" onClick={() => nav("home")}>
                          <span className="tt-plus">+</span>
                          <span className="tt-add-label">Add meal</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════
   SHOPPING PAGE  –  Component 3b
═══════════════════════════ */
export function ShoppingPage() {
  const { mealPlan, nav } = useContext(Ctx);
  const [details, setDetails] = useState({});
  const [checked, setChecked] = useState({});
  const [loading, setLoading] = useState(false);

  const allMeals  = Object.values(mealPlan).flatMap(d => Object.values(d).filter(Boolean));
  const uniqueIds = [...new Set(allMeals.map(m => m.idMeal))];

  useEffect(() => {
    if (!uniqueIds.length) return;
    setLoading(true);
    Promise.all(
      uniqueIds.map(id =>
        fetch(`${API}/lookup.php?i=${id}`)
          .then(r => r.json()).then(d => d.meals?.[0]).catch(() => null)
      )
    ).then(arr => {
      const map = {};
      arr.filter(Boolean).forEach(m => { map[m.idMeal] = m; });
      setDetails(map);
      setLoading(false);
    });
  }, [uniqueIds.join(",")]);

  const ingMap = {};
  Object.values(details).forEach(meal => {
    for (let i = 1; i <= 20; i++) {
      const n = meal[`strIngredient${i}`]?.trim();
      const m = meal[`strMeasure${i}`]?.trim();
      if (n) {
        const k = n.toLowerCase();
        if (!ingMap[k]) ingMap[k] = { name: n, measures: [], from: [] };
        if (m) ingMap[k].measures.push(m);
        ingMap[k].from.push(meal.strMeal);
      }
    }
  });

  const items = Object.entries(ingMap);
  const done  = items.filter(([k]) => checked[k]).length;
  const pct   = items.length ? Math.round((done / items.length) * 100) : 0;

  if (!allMeals.length) return (
    <div className="empty-page">
      <div className="empty-icon">🛒</div>
      <h2 className="empty-title">No meals planned yet</h2>
      <p className="empty-desc">
        Add meals in the <button className="inline-link" onClick={() => nav("planner")}>Planner</button> first.
      </p>
    </div>
  );

  return (
    <div className="shopping-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Shopping List</h1>
          <p className="page-sub">{done} of {items.length} items collected</p>
        </div>
        <button className="btn-outline" onClick={() => setChecked({})}>↺ Reset All</button>
      </div>

      <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
      <p className="progress-label">{pct}% complete</p>

      <div className="meal-strip">
        <span className="strip-label">From your plan: </span>
        {[...new Set(allMeals.map(m => m.strMeal))].map(n => (
          <span key={n} className="meal-chip">{n}</span>
        ))}
      </div>

      {loading ? <p className="loading-text">Fetching ingredient details…</p> : (
        <div className="shop-list">
          {items.map(([k, ing]) => (
            <div key={k} className={`shop-item${checked[k] ? " shop-item-done" : ""}`}
              onClick={() => setChecked(p => ({ ...p, [k]: !p[k] }))}>
              <div className={`shop-check${checked[k] ? " shop-check-on" : ""}`}>{checked[k] ? "✓" : ""}</div>
              <img
                src={`https://www.themealdb.com/images/ingredients/${encodeURIComponent(ing.name)}-Small.png`}
                alt={ing.name} className="shop-ing-img"
                onError={e => { e.target.style.display = "none"; }} />
              <div className="shop-ing-info">
                <span className="shop-ing-name">{ing.name}</span>
                {ing.measures.length > 0 && (
                  <span className="shop-ing-qty">{[...new Set(ing.measures)].join(" + ")}</span>
                )}
                <span className="shop-ing-for">For: {[...new Set(ing.from)].slice(0, 2).join(", ")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}