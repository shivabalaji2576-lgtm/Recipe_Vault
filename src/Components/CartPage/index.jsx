import { useState, useEffect, useContext } from "react";
import { Ctx, fmt, getPrice, DELIVERY } from "../constants";

/* ═══════════════════════════
   PAYMENT METHODS CONFIG
═══════════════════════════ */
const PAYMENT_METHODS = [
  {
    id: "phonepe",
    label: "PhonePe",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/PhonePe_Logo.png/200px-PhonePe_Logo.png",
    emoji: "💜",
    tag: "UPI",
    color: "#5f259f",
    bg: "#f5eeff",
    border: "#c89ef5",
    desc: "Pay using PhonePe UPI",
  },
  {
    id: "googlepay",
    label: "Google Pay",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/200px-Google_Pay_Logo.svg.png",
    emoji: "🔵",
    tag: "UPI",
    color: "#1a73e8",
    bg: "#e8f0fe",
    border: "#93b8f7",
    desc: "Pay using Google Pay UPI",
  },
  {
    id: "cod",
    label: "Cash on Delivery",
    icon: null,
    emoji: "💵",
    tag: "COD",
    color: "#2a7040",
    bg: "#edfaf3",
    border: "#7dd3a8",
    desc: "Pay with cash when delivered",
  },
];

/* ═══════════════════════════
   PAYMENT MODAL
═══════════════════════════ */
function PaymentModal({ total, onSelect, onClose }) {
  const [selected, setSelected] = useState(null);
  const [applied, setApplied] = useState(null);
  const [animating, setAnimating] = useState(false);

  const handleApply = () => {
    if (!selected) return;
    const method = PAYMENT_METHODS.find(m => m.id === selected);
    setAnimating(true);
    setTimeout(() => { setApplied(method); setAnimating(false); }, 600);
  };

  return (
    <>
      <div className="pm-backdrop" onClick={onClose} />
      <div className="pm-modal">
        {/* Header */}
        <div className="pm-header">
          <div className="pm-header-left">
            <span className="pm-header-icon">💳</span>
            <div>
              <h2 className="pm-title">Choose Payment</h2>
              <p className="pm-subtitle">Select a method to pay {fmt(total)}</p>
            </div>
          </div>
          <button className="pm-close" onClick={onClose}>✕</button>
        </div>

        <div className="pm-body">
          {/* Applied badge */}
          {applied && (
            <div className="pm-applied-bar" style={{ background: applied.bg, borderColor: applied.border }}>
              <span className="pm-applied-emoji">{applied.emoji}</span>
              <div className="pm-applied-info">
                <p className="pm-applied-label" style={{ color: applied.color }}>✓ {applied.label} Applied</p>
                <p className="pm-applied-desc">{applied.desc}</p>
              </div>
              <button className="pm-change-btn" onClick={() => { setApplied(null); setSelected(null); }}>
                Change
              </button>
            </div>
          )}

          {/* Method list */}
          {!applied && (
            <div className="pm-methods">
              <p className="pm-methods-label">Available Payment Options</p>

              {PAYMENT_METHODS.map(m => (
                <div
                  key={m.id}
                  className={`pm-method-card${selected === m.id ? " pm-method-selected" : ""}`}
                  style={selected === m.id ? { borderColor: m.border, background: m.bg } : {}}
                  onClick={() => setSelected(m.id)}
                >
                  <div className="pm-method-left">
                    <div className="pm-radio" style={selected === m.id ? { borderColor: m.color } : {}}>
                      {selected === m.id && <div className="pm-radio-dot" style={{ background: m.color }} />}
                    </div>
                    <div className="pm-method-icon-wrap" style={{ background: m.bg, borderColor: m.border }}>
                      {m.icon ? (
                        <img
                          src={m.icon} alt={m.label} className="pm-method-logo"
                          onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                        />
                      ) : null}
                      <span className="pm-method-emoji" style={{ display: m.icon ? "none" : "flex" }}>
                        {m.emoji}
                      </span>
                    </div>
                    <div>
                      <p className="pm-method-name">{m.label}</p>
                      <p className="pm-method-desc">{m.desc}</p>
                    </div>
                  </div>
                  <span className="pm-method-tag" style={{ background: m.color }}>{m.tag}</span>
                </div>
              ))}

              <button
                className={`pm-apply-btn${selected ? " pm-apply-active" : ""}${animating ? " pm-apply-spin" : ""}`}
                onClick={handleApply}
                disabled={!selected || animating}
              >
                {animating
                  ? <><span className="pm-spin-icon">◌</span> Applying…</>
                  : "Apply Payment Method →"}
              </button>
            </div>
          )}

          {/* Bill */}
          <div className="pm-bill">
            <div className="pm-bill-row"><span>Amount to Pay</span><span className="pm-bill-total">{fmt(total)}</span></div>
            <div className="pm-bill-secure">🔒 100% Secure Payment</div>
          </div>
        </div>

        {/* Confirm footer */}
        {applied && (
          <div className="pm-footer">
            <div className="pm-footer-info">
              <span className="pm-footer-emoji">{applied.emoji}</span>
              <span>Paying via <strong>{applied.label}</strong></span>
            </div>
            <button className="pm-confirm-btn" onClick={() => onSelect(applied)}>
              ✅ Confirm & Place Order · {fmt(total)}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════
   CART DRAWER (slide-in)
═══════════════════════════ */
export function CartDrawer() {
  const {
    auth, cart, removeFromCart, updateQty, clearCart,
    placeOrder, orderPlaced, setOrderPlaced,
    sending, cartOpen, setCartOpen, nav,
  } = useContext(Ctx);

  const [showPayment, setShowPayment] = useState(false);
  const [appliedMethod, setAppliedMethod] = useState(null);

  const sub = cart.reduce((s, c) => s + c.qty * (c.price || getPrice(c)), 0);
  const total = sub + (cart.length ? DELIVERY : 0);

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") { setShowPayment(false); setCartOpen(false); } };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const handlePaymentSelect = method => {
    setAppliedMethod(method);
    setShowPayment(false);
  };

  if (!cartOpen) return null;

  return (
    <>
      <div className="cd-overlay" onClick={() => { setShowPayment(false); setCartOpen(false); }} />
      {showPayment && (
        <PaymentModal total={total} onSelect={handlePaymentSelect} onClose={() => setShowPayment(false)} />
      )}

      <div className="cd-drawer">
        {/* Header */}
        <div className="cd-hdr">
          <div className="cd-hdr-left">
            <div className="cd-hdr-icon">🛒</div>
            <div>
              <h2 className="cd-hdr-title">Your Cart</h2>
              <p className="cd-hdr-sub">
                {cart.length === 0 ? "Empty"
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
              <button className="cd-browse-btn" onClick={() => { setCartOpen(false); nav("home"); }}>🍽 Browse Recipes</button>
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

              {/* Payment badge inside drawer */}
              {appliedMethod ? (
                <div className="cd-payment-applied" style={{ background: appliedMethod.bg, borderColor: appliedMethod.border }}>
                  <span className="cd-pay-emoji">{appliedMethod.emoji}</span>
                  <span className="cd-pay-name" style={{ color: appliedMethod.color }}>
                    ✓ {appliedMethod.label}
                  </span>
                  <button className="cd-pay-change" onClick={() => { setAppliedMethod(null); setShowPayment(true); }}>
                    Change
                  </button>
                </div>
              ) : (
                <button className="cd-select-pay-btn" onClick={() => setShowPayment(true)}>
                  💳 Select Payment Method
                </button>
              )}

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
                <p className="cd-placed-sub">
                  {appliedMethod ? `${appliedMethod.emoji} ${appliedMethod.label} · ` : ""}
                  Email sent to {auth?.email}
                </p>
                <div className="cd-placed-actions">
                  <button className="cd-new-btn" onClick={() => { clearCart(); setOrderPlaced(false); setAppliedMethod(null); }}>
                    🛒 New Order
                  </button>
                  <button className="cd-hist-btn" onClick={() => { setCartOpen(false); nav("orders"); }}>
                    📋 History
                  </button>
                </div>
              </div>
            ) : appliedMethod ? (
              <>
                <button
                  className={`cd-place-btn${sending ? " cd-place-busy" : ""}`}
                  onClick={placeOrder}
                  disabled={sending}
                >
                  {sending
                    ? <><span className="cd-spin">◌</span> Sending…</>
                    : <><span>✅ {appliedMethod.emoji} Place Order</span><span className="cd-place-total">{fmt(total)}</span></>}
                </button>
                <button className="cd-clear-btn" onClick={() => { clearCart(); setOrderPlaced(false); setAppliedMethod(null); }}>
                  🗑 Clear Cart
                </button>
              </>
            ) : (
              <>
                <button className="cd-place-btn cd-pay-locked" onClick={() => setShowPayment(true)}>
                  <span>💳 Select Payment & Order</span>
                  <span className="cd-place-total">{fmt(total)}</span>
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
   CART PAGE (full page)
═══════════════════════════ */
export default function CartPage() {
  const {
    auth, cart, removeFromCart, updateQty, clearCart,
    placeOrder, orderPlaced, setOrderPlaced,
    sending, nav,
  } = useContext(Ctx);

  const [showPayment, setShowPayment] = useState(false);
  const [appliedMethod, setAppliedMethod] = useState(null);

  const sub = cart.reduce((s, c) => s + c.qty * (c.price || getPrice(c)), 0);
  const total = sub + (cart.length ? DELIVERY : 0);

  const handlePaymentSelect = method => {
    setAppliedMethod(method);
    setShowPayment(false);
  };

  return (
    <div className="cart-page">
      {showPayment && (
        <PaymentModal total={total} onSelect={handlePaymentSelect} onClose={() => setShowPayment(false)} />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">🛒 Your Cart</h1>
          <p className="page-sub">
            {cart.length === 0 ? "Empty — add items from Explore"
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

          {/* ── Items column ── */}
          <div className="cart-items-col">
            <div className="cart-items-header">
              <h3 className="cart-items-title">
                Order Items <span className="cart-count-badge">{cart.length}</span>
              </h3>
              <button className="cart-clear-link"
                onClick={() => { clearCart(); setOrderPlaced(false); setAppliedMethod(null); }}>
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

          {/* ── Summary panel ── */}
          <div className="cart-summary-panel">
            <h3 className="csp-title">Order Summary</h3>

            <div className="csp-email-row">
              <span>📧</span>
              <span>Confirmation to <strong>{auth?.email}</strong></span>
            </div>

            <div className="csp-divider" />
            <div className="csp-row">
              <span>Subtotal ({cart.reduce((s, c) => s + c.qty, 0)} items)</span>
              <span>{fmt(sub)}</span>
            </div>
            <div className="csp-row"><span>🚚 Delivery</span><span>{fmt(DELIVERY)}</span></div>
            <div className="csp-row csp-savings">
              <span>🎉 Free delivery on orders above ₹499</span>
              <span>{sub >= 499 ? "✓ Applied!" : fmt(499 - sub) + " away"}</span>
            </div>
            <div className="csp-divider" />
            <div className="csp-row csp-total"><span>Total</span><span>{fmt(total)}</span></div>

            {/* ── Payment method picker ── */}
            <div className="csp-payment-section">
              <p className="csp-payment-label">💳 Payment Method</p>
              {appliedMethod ? (
                <div className="csp-payment-applied"
                  style={{ background: appliedMethod.bg, borderColor: appliedMethod.border }}>
                  <div className="csp-pay-left">
                    <span className="csp-pay-emoji">{appliedMethod.emoji}</span>
                    <div>
                      <p className="csp-pay-name" style={{ color: appliedMethod.color }}>
                        ✓ {appliedMethod.label}
                      </p>
                      <p className="csp-pay-desc">{appliedMethod.desc}</p>
                    </div>
                  </div>
                  <button className="csp-pay-change"
                    onClick={() => { setAppliedMethod(null); setShowPayment(true); }}>
                    Change
                  </button>
                </div>
              ) : (
                <button className="csp-select-pay-btn" onClick={() => setShowPayment(true)}>
                  💳 Select Payment Method
                </button>
              )}
            </div>

            {/* ── CTA ── */}
            {orderPlaced ? (
              <div className="csp-placed">
                <div className="csp-placed-check">✅</div>
                <h3 className="csp-placed-title">Order Placed!</h3>
                {appliedMethod && (
                  <p className="csp-placed-pay">{appliedMethod.emoji} Paid via {appliedMethod.label}</p>
                )}
                <p className="csp-placed-sub">Confirmation sent to {auth?.email}</p>
                <p className="csp-placed-eta">🕐 ETA: 30–45 minutes · Hyderabad</p>
                <button className="csp-new-btn"
                  onClick={() => { clearCart(); setOrderPlaced(false); setAppliedMethod(null); }}>
                  🛒 Place New Order
                </button>
                <button className="csp-hist-btn" onClick={() => nav("orders")}>📋 View Order History</button>
              </div>
            ) : appliedMethod ? (
              <button
                className={`csp-place-btn${sending ? " csp-busy" : ""}`}
                onClick={placeOrder}
                disabled={sending}
              >
                {sending
                  ? <><span className="csp-spin">◌</span> Sending confirmation…</>
                  : <>✅ Place Order · {fmt(total)}</>}
              </button>
            ) : (
              <button className="csp-place-btn csp-pay-locked" onClick={() => setShowPayment(true)}>
                💳 Select Payment to Continue
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