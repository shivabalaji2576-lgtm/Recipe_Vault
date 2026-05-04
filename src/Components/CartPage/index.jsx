import { useContext, useEffect } from "react";
import { Ctx, DELIVERY, fmt, getPrice } from "../constants";

/* ═══════════════════════════
   CART DRAWER  –  Component 7a (slide-in panel)
═══════════════════════════ */
export function CartDrawer() {
  const {
    auth, cart, removeFromCart, updateQty, clearCart,
    placeOrder, orderPlaced, setOrderPlaced, sending,
    cartOpen, setCartOpen, nav,
  } = useContext(Ctx);

  const sub   = cart.reduce((s, c) => s + c.qty * (c.price || getPrice(c)), 0);
  const total = sub + (cart.length ? DELIVERY : 0);

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") setCartOpen(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  if (!cartOpen) return null;

  return (
    <>
      <div className="cd-overlay" onClick={() => setCartOpen(false)} />
      <div className="cd-drawer">
        {/* Header */}
        <div className="cd-hdr">
          <div className="cd-hdr-left">
            <div className="cd-hdr-icon">🛒</div>
            <div>
              <h2 className="cd-hdr-title">Your Cart</h2>
              <p className="cd-hdr-sub">
                {cart.length === 0
                  ? "Empty"
                  : `${cart.reduce((s, c) => s + c.qty, 0)} item${cart.reduce((s, c) => s + c.qty, 0) !== 1 ? "s" : ""} · ${fmt(total)}`}
              </p>
            </div>
          </div>
          <button className="cd-close" onClick={() => setCartOpen(false)}>✕</button>
        </div>

        {/* Body */}
        <div className="cd-body">
          {cart.length === 0 ? (
            <div className="cd-empty">
              <div className="cd-empty-emoji">🍽️</div>
              <h3 className="cd-empty-title">Your cart is empty</h3>
              <p className="cd-empty-desc">Browse Explore and tap <strong>Add to Cart</strong> on any dish.</p>
              <button className="cd-browse-btn" onClick={() => { setCartOpen(false); nav("home"); }}>
                🍽 Browse Recipes
              </button>
            </div>
          ) : (
            <>
              <div className="cd-items">
                {cart.map(item => {
                  const price = item.price || getPrice(item);
                  return (
                    <div key={item.idMeal} className="cd-item">
                      <img src={item.strMealThumb} alt={item.strMeal} className="cd-item-img"
                        onError={e => { e.target.src = "https://placehold.co/68x68/e8f5e8/2a7040?text=🍽"; }} />
                      <div className="cd-item-info">
                        <p className="cd-item-name">{item.strMeal}</p>
                        <p className="cd-item-cat">{item.strCategory || "Healthy Meal"}</p>
                        <p className="cd-item-unit-price">{fmt(price)} each</p>
                      </div>
                      <div className="cd-item-controls">
                        <div className="cd-stepper">
                          <button className="cd-step-btn" onClick={() => updateQty(item.idMeal, -1)}>−</button>
                          <span className="cd-step-num">{item.qty}</span>
                          <button className="cd-step-btn" onClick={() => updateQty(item.idMeal, +1)}>+</button>
                        </div>
                        <span className="cd-item-total">{fmt(item.qty * price)}</span>
                        <button className="cd-remove" onClick={() => removeFromCart(item.idMeal)} title="Remove">🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="cd-delivery-bar">
                <span>🚚 Delivery · Hyderabad · 30–45 min</span>
                <span className="cd-delivery-amt">+{fmt(DELIVERY)}</span>
              </div>

              <div className="cd-summary">
                <div className="cd-sum-row"><span>Subtotal</span><span>{fmt(sub)}</span></div>
                <div className="cd-sum-row"><span>Delivery</span><span>{fmt(DELIVERY)}</span></div>
                <div className="cd-sum-divider" />
                <div className="cd-sum-row cd-sum-total"><span>Total</span><span>{fmt(total)}</span></div>
              </div>

              <div className="cd-email-notice">
                <span>📧</span>
                <span>Confirmation sent to <strong>{auth?.email}</strong></span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="cd-footer">
            {orderPlaced ? (
              <div className="cd-placed">
                <div className="cd-placed-icon">✅</div>
                <p className="cd-placed-title">Order Placed!</p>
                <p className="cd-placed-sub">Email sent to {auth?.email}</p>
                <div className="cd-placed-actions">
                  <button className="cd-new-btn" onClick={() => { clearCart(); setOrderPlaced(false); }}>🛒 New Order</button>
                  <button className="cd-hist-btn" onClick={() => { setCartOpen(false); nav("orders"); }}>📋 History</button>
                </div>
              </div>
            ) : (
              <>
                <button className={`cd-place-btn${sending ? " cd-place-busy" : ""}`}
                  onClick={placeOrder} disabled={sending}>
                  {sending
                    ? <><span className="cd-spin">◌</span> Sending…</>
                    : <><span>✅ Place Order</span><span className="cd-place-total">{fmt(total)}</span></>}
                </button>
                <button className="cd-clear-btn" onClick={() => { clearCart(); setOrderPlaced(false); }}>
                  🗑 Clear Cart
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════
   CART PAGE  –  Component 7b (full page)
═══════════════════════════ */
export default function CartPage() {
  const {
    auth, cart, removeFromCart, updateQty, clearCart,
    placeOrder, orderPlaced, setOrderPlaced, sending, nav,
  } = useContext(Ctx);

  const sub   = cart.reduce((s, c) => s + c.qty * (c.price || getPrice(c)), 0);
  const total = sub + (cart.length ? DELIVERY : 0);

  return (
    <div className="cart-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🛒 Your Cart</h1>
          <p className="page-sub">
            {cart.length === 0
              ? "Empty — add items from Explore"
              : `${cart.reduce((s, c) => s + c.qty, 0)} item${cart.reduce((s, c) => s + c.qty, 0) !== 1 ? "s" : ""} · Total ${fmt(total)}`}
          </p>
        </div>
        <button className="btn-outline" onClick={() => nav("home")}>🍽 Continue Shopping</button>
      </div>

      {cart.length === 0 ? (
        <div className="empty-page">
          <div className="empty-icon" style={{ fontSize: 72 }}>🛒</div>
          <h2 className="empty-title">Your cart is empty</h2>
          <p className="empty-desc">
            Go to <button className="inline-link" onClick={() => nav("home")}>Explore</button> and tap{" "}
            <strong>🛒 Add to Cart</strong> on any dish.
          </p>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Items column */}
          <div className="cart-items-col">
            <div className="cart-items-header">
              <h3 className="cart-items-title">
                Order Items <span className="cart-count-badge">{cart.length}</span>
              </h3>
              <button className="cart-clear-link" onClick={() => { clearCart(); setOrderPlaced(false); }}>
                🗑 Clear all
              </button>
            </div>

            {cart.map(item => {
              const price = item.price || getPrice(item);
              return (
                <div key={item.idMeal} className="cart-row">
                  <img src={item.strMealThumb} alt={item.strMeal} className="cart-row-img"
                    onError={e => { e.target.src = "https://placehold.co/88x88/e8f5e8/2a7040?text=🍽"; }} />
                  <div className="cart-row-info">
                    <p className="cart-row-name">{item.strMeal}</p>
                    <p className="cart-row-cat">🥗 {item.strCategory || "Healthy Meal"}</p>
                    <p className="cart-row-unit">{fmt(price)} per item</p>
                  </div>
                  <div className="cart-row-right">
                    <div className="cart-stepper">
                      <button className="cst-btn" onClick={() => updateQty(item.idMeal, -1)}>−</button>
                      <span className="cst-num">{item.qty}</span>
                      <button className="cst-btn" onClick={() => updateQty(item.idMeal, +1)}>+</button>
                    </div>
                    <span className="cart-row-total">{fmt(item.qty * price)}</span>
                    <button className="cart-row-remove" onClick={() => removeFromCart(item.idMeal)}>✕ Remove</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary panel */}
          <div className="cart-summary-panel">
            <h3 className="csp-title">Order Summary</h3>
            <div className="csp-email-row">
              <span>📧</span>
              <span>Confirmation to <strong>{auth?.email}</strong></span>
            </div>
            <div className="csp-divider" />
            <div className="csp-row"><span>Subtotal ({cart.reduce((s, c) => s + c.qty, 0)} items)</span><span>{fmt(sub)}</span></div>
            <div className="csp-row"><span>🚚 Delivery</span><span>{fmt(DELIVERY)}</span></div>
            <div className="csp-row csp-savings">
              <span>🎉 Free delivery on orders above ₹499</span>
              <span>{sub >= 499 ? "✓ Applied!" : fmt(499 - sub) + " away"}</span>
            </div>
            <div className="csp-divider" />
            <div className="csp-row csp-total"><span>Total</span><span>{fmt(total)}</span></div>

            {orderPlaced ? (
              <div className="csp-placed">
                <div className="csp-placed-check">✅</div>
                <h3 className="csp-placed-title">Order Placed!</h3>
                <p className="csp-placed-sub">Confirmation sent to {auth?.email}</p>
                <p className="csp-placed-eta">🕐 ETA: 30–45 minutes · Hyderabad</p>
                <button className="csp-new-btn" onClick={() => { clearCart(); setOrderPlaced(false); }}>🛒 Place New Order</button>
                <button className="csp-hist-btn" onClick={() => nav("orders")}>📋 View Order History</button>
              </div>
            ) : (
              <button className={`csp-place-btn${sending ? " csp-busy" : ""}`}
                onClick={placeOrder} disabled={sending}>
                {sending
                  ? <><span className="csp-spin">◌</span> Sending confirmation…</>
                  : <>✅ Place Order · {fmt(total)}</>}
              </button>
            )}

            <div className="csp-assurance">
              <span>🔒 Secure · 🚀 Fast Delivery · 🥗 Fresh &amp; Healthy</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}