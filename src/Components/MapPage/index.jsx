import { useState, useEffect, useRef, useContext } from "react";
import { Ctx, RESTAURANTS } from "../constants";

/* ═══════════════════════════
   MAP PAGE  –  Component 5
═══════════════════════════ */
export default function MapPage() {
  const { nav, addToCart, setCartOpen } = useContext(Ctx);
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const [selRest,  setSelRest]  = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [msgs,     setMsgs]     = useState({});

  useEffect(() => {
    let mounted = true;

    const init = () => {
      if (!mapRef.current || mapInstance.current || !window.L) return;
      const L   = window.L;
      const map = L.map(mapRef.current).setView([17.3850, 78.4867], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap", maxZoom: 19,
      }).addTo(map);

      RESTAURANTS.forEach(r => {
        const icon = L.divIcon({
          html: `<div style="width:32px;height:32px;background:${r.color};border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;
            border:2px solid rgba(255,255,255,.8)">
            <span style="transform:rotate(45deg);display:block;color:#fff;font-weight:700;font-size:13px">
              ${r.name[0]}
            </span></div>`,
          className: "", iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -34],
        });
        L.marker([r.lat, r.lng], { icon }).addTo(map)
          .bindPopup(`<b>${r.name}</b><br/>${r.cuisine}<br/>⭐${r.rating} · ${r.hrs}`);
      });

      mapInstance.current = map;
      if (mounted) setMapReady(true);
    };

    if (window.L) {
      init();
    } else {
      if (!document.getElementById("leaflet-css")) {
        const l = document.createElement("link");
        l.id = "leaflet-css"; l.rel = "stylesheet";
        l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(l);
      }
      if (!document.getElementById("leaflet-js")) {
        const s = document.createElement("script");
        s.id = "leaflet-js";
        s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        s.onload = () => { if (mounted) init(); };
        document.body.appendChild(s);
      }
    }

    return () => {
      mounted = false;
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, []);

  const flyTo = r => {
    setSelRest(r);
    if (mapInstance.current) mapInstance.current.flyTo([r.lat, r.lng], 16, { duration: 1 });
  };

  const doAdd = (r, e) => {
    e.stopPropagation();
    const dummy = {
      idMeal: `rest_${r.id}`,
      strMeal: `${r.name} Special`,
      strMealThumb: `https://placehold.co/300x220/${r.color.replace("#", "")}/ffffff?text=${encodeURIComponent(r.name[0])}`,
      strCategory: r.cuisine,
    };
    addToCart(dummy);
    setMsgs(p => ({ ...p, [r.id]: "✅ Added to cart!" }));
    setTimeout(() => setMsgs(p => ({ ...p, [r.id]: "" })), 2500);
  };

  return (
    <div className="map-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nearby Restaurants</h1>
          <p className="page-sub">Healthy restaurants in Hyderabad</p>
        </div>
        <button className="btn-outline" onClick={() => nav("home")}>🍽 Browse Recipes</button>
      </div>

      {/* Leaflet map */}
      <div className="map-wrapper">
        <div ref={mapRef} className="leaflet-map-container" />
        {!mapReady && (
          <div className="map-loading-overlay">
            <div className="spinner" /><span>Loading map…</span>
          </div>
        )}
      </div>

      <h2 className="restaurants-section-title">🍴 {RESTAURANTS.length} Restaurants in Hyderabad</h2>

      <div className="restaurants-grid">
        {RESTAURANTS.map(r => (
          <div key={r.id}
            className={`restaurant-card${selRest?.id === r.id ? " restaurant-card-selected" : ""}`}
            onClick={() => flyTo(r)}>
            <div className="rest-avatar" style={{ background: r.color }}>
              <span className="rest-avatar-letter">{r.name[0]}</span>
            </div>
            <div className="rest-body">
              <div className="rest-top-row">
                <h3 className="rest-name">{r.name}</h3>
                <span className="rest-rating">⭐ {r.rating}</span>
              </div>
              <p className="rest-cuisine">{r.cuisine}</p>
              <p className="rest-address">📍 {r.addr}</p>
              <p className="rest-hours">🕐 {r.hrs}</p>
              {msgs[r.id] && <p className="rest-auto-msg">{msgs[r.id]}</p>}
              <div className="rest-actions">
                <button className="rest-map-btn" onClick={e => { e.stopPropagation(); flyTo(r); }}>🗺️ View on Map</button>
                <button className="rest-auto-btn" onClick={e => doAdd(r, e)}>🛒 Add to Cart</button>
                <button className="rest-order-btn" onClick={e => { e.stopPropagation(); setCartOpen(true); }}>View Cart</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}