import { useContext } from "react";
import { Ctx, DELIVERY, fmt, getPrice } from "../constants";

/* ═══════════════════════════
   ORDER HISTORY PAGE  –  Component 4
═══════════════════════════ */
export default function OrderHistoryPage() {
  const { auth, orderHistory, cart, setCartOpen } = useContext(Ctx);
  const cartTotal =
    cart.reduce((s, c) => s + c.qty * (c.price || getPrice(c)), 0) +
    (cart.length ? DELIVERY : 0);

  return (
    <div className="orders-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Order History</h1>
          <p className="page-sub">📧 {auth.email}</p>
        </div>
        {cart.length > 0 && (
          <button className="btn-green" onClick={() => setCartOpen(true)}>
            🛒 Cart ({cart.reduce((s, c) => s + c.qty, 0)}) · {fmt(cartTotal)}
          </button>
        )}
      </div>

      {orderHistory.length === 0 ? (
        <div className="empty-page">
          <div className="empty-icon">📋</div>
          <h2 className="empty-title">No orders yet</h2>
          <p className="empty-desc">Add items to cart and place your first order!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[...orderHistory].reverse().map((ord, i) => (
            <div key={ord.id || i}
              style={{ background: "#fff", border: "1px solid #d4ead4", borderRadius: 16, overflow: "hidden" }}>

              {/* Header row */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px", background: "#f6fcf6", borderBottom: "1px solid #e4f0e4",
              }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#1a3020", display: "block" }}>
                    Order #{orderHistory.length - i}
                  </span>
                  <span style={{ fontSize: 12, color: "#7a9a7a" }}>
                    {new Date(ord.date).toLocaleString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#2a7040" }}>{fmt(ord.total)}</span>
              </div>

              {/* Items */}
              <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                {ord.items.map((item, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img src={item.strMealThumb} alt={item.strMeal}
                      style={{
                        width: 44, height: 44, borderRadius: 8, objectFit: "cover",
                        border: "1px solid #c8e8c8", flexShrink: 0,
                      }}
                      onError={e => { e.target.src = "https://placehold.co/44x44/e8f5e8/2a7040?text=🍽"; }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#1a3020" }}>{item.strMeal}</span>
                    <span style={{
                      fontSize: 12, color: "#7a9a7a", background: "#f0f8f0",
                      padding: "2px 8px", borderRadius: 6,
                    }}>×{item.qty}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#2a7040" }}>
                      {fmt(item.qty * (item.price || getPrice(item)))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{
                display: "flex", justifyContent: "space-between", padding: "10px 18px",
                borderTop: "1px solid #e4f0e4", background: "#fafffe",
              }}>
                <span style={{ fontSize: 12.5, color: "#2a7040", fontWeight: 600 }}>✅ Delivered · Hyderabad</span>
                <span style={{ fontSize: 12, color: "#9aaa9a" }}>
                  {ord.items.length} item{ord.items.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}