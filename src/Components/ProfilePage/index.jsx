import { useState, useContext } from "react";
import { Ctx, ADDRESS_LABELS, ADDRESS_LABEL_ICONS } from "../constants";

/* ═══════════════════════════
   PROFILE PAGE  –  Component 6
═══════════════════════════ */
export default function ProfilePage({ auth, onLogout, onUpdateAuth }) {
  const { nav } = useContext(Ctx);

  /* ── Name editing ── */
  const [editingName, setEditingName] = useState(false);
  const [nameInput,   setNameInput]   = useState(auth.name);
  const [nameSaved,   setNameSaved]   = useState(false);

  /* ── City editing ── */
  const [editingCity, setEditingCity] = useState(false);
  const [cityInput,   setCityInput]   = useState(() => {
    try { return localStorage.getItem("rv_city") || "Hyderabad, Telangana"; } catch { return "Hyderabad, Telangana"; }
  });
  const [citySaved, setCitySaved] = useState(false);

  /* ── Address management ── */
  const [addresses,     setAddresses]     = useState(() => { try { return JSON.parse(localStorage.getItem("rv_addresses")) || []; } catch { return []; } });
  const [defaultAddr,   setDefaultAddr]   = useState(() => { try { return localStorage.getItem("rv_default_addr") || ""; } catch { return ""; } });
  const [showForm,      setShowForm]      = useState(false);
  const [editIndex,     setEditIndex]     = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formSaved,     setFormSaved]     = useState(false);

  const EMPTY = { label: "Home", name: "", phone: "", line1: "", line2: "", city: "Hyderabad", state: "Telangana", pincode: "", landmark: "" };
  const [form,    setForm]    = useState(EMPTY);
  const [formErr, setFormErr] = useState({});

  /* ── Quick stats helpers ── */
  const ordH    = () => { try { return JSON.parse(localStorage.getItem("rv_order_history")) || []; } catch { return []; } };
  const cartD   = () => { try { return JSON.parse(localStorage.getItem("rv_cart")) || []; } catch { return []; } };
  const mpD     = () => { try { return JSON.parse(localStorage.getItem("rv_mealplan")); } catch { return null; } };
  const plannedCnt = (() => {
    const mp = mpD();
    return mp ? Object.values(mp).reduce((s, d) => s + Object.values(d).filter(Boolean).length, 0) : 0;
  })();

  /* ── Persist helpers ── */
  const persist    = list => { setAddresses(list); localStorage.setItem("rv_addresses", JSON.stringify(list)); };
  const persistDef = id   => { setDefaultAddr(id); localStorage.setItem("rv_default_addr", id); };

  const saveName = () => {
    if (!nameInput.trim()) return;
    const u = { ...auth, name: nameInput.trim() };
    onUpdateAuth(u);
    try {
      const a = JSON.parse(localStorage.getItem("rv_accounts")) || {};
      if (a[auth.email]) a[auth.email].name = u.name;
      localStorage.setItem("rv_accounts", JSON.stringify(a));
    } catch (e) { console.error("Error saving account:", e); }
    setEditingName(false); setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
  };

  const saveCity = () => {
    if (!cityInput.trim()) return;
    localStorage.setItem("rv_city", cityInput.trim());
    setEditingCity(false); setCitySaved(true);
    setTimeout(() => setCitySaved(false), 2500);
  };

  /* ── Form helpers ── */
  const ff = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setFormErr(p => { const n = { ...p }; delete n[k]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                               e.name    = "Required.";
    if (!/^\d{10}$/.test(form.phone.replace(/\s/g, "")))e.phone   = "10-digit number.";
    if (!form.line1.trim())                              e.line1   = "Required.";
    if (!form.city.trim())                               e.city    = "Required.";
    if (!/^\d{6}$/.test(form.pincode.trim()))            e.pincode = "6-digit PIN.";
    return e;
  };

  const openAdd  = () => { setForm(EMPTY); setEditIndex(null); setFormErr({}); setShowForm(true); };
  const openEdit = idx => { setForm({ ...addresses[idx] }); setEditIndex(idx); setFormErr({}); setShowForm(true); };

  const submitForm = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErr(errs); return; }
    const na   = { ...form, id: editIndex !== null ? addresses[editIndex].id : `addr_${Date.now()}` };
    const list = editIndex !== null ? addresses.map((a, i) => i === editIndex ? na : a) : [...addresses, na];
    persist(list);
    if (!defaultAddr || list.length === 1) persistDef(na.id);
    setShowForm(false); setFormSaved(true);
    setTimeout(() => setFormSaved(false), 2500);
  };

  const delAddr = idx => {
    const list = addresses.filter((_, i) => i !== idx);
    persist(list);
    if (defaultAddr === addresses[idx].id) persistDef(list[0]?.id || "");
    setDeleteConfirm(null);
  };

  const oH = ordH(), cD = cartD();

  return (
    <div className="profile-page">
      {/* Banner */}
      <div className="profile-banner">
        <div className="profile-banner-deco" />
        <div className="profile-avatar-wrap">
          <div className="profile-big-avatar">{auth.name[0].toUpperCase()}</div>
          <div className="profile-avatar-ring" />
        </div>
        <div className="profile-banner-info">
          <h1 className="profile-banner-name">{auth.name}</h1>
          <p className="profile-banner-email">📧 {auth.email}</p>
          <p className="profile-banner-city">📍 {cityInput}</p>
        </div>
        <div className="profile-banner-stats">
          <div className="pbs-stat"><span className="pbs-num">{oH.length}</span><span className="pbs-lbl">Orders</span></div>
          <div className="pbs-divider" />
          <div className="pbs-stat"><span className="pbs-num">{cD.reduce((s, c) => s + c.qty, 0)}</span><span className="pbs-lbl">In Cart</span></div>
          <div className="pbs-divider" />
          <div className="pbs-stat"><span className="pbs-num">{plannedCnt}</span><span className="pbs-lbl">Planned</span></div>
          <div className="pbs-divider" />
          <div className="pbs-stat"><span className="pbs-num">{addresses.length}</span><span className="pbs-lbl">Addresses</span></div>
        </div>
      </div>

      {nameSaved  && <div className="profile-flash">✅ Name updated!</div>}
      {citySaved  && <div className="profile-flash">✅ City updated!</div>}
      {formSaved  && <div className="profile-flash">✅ Address saved!</div>}

      <div className="profile-body">
        {/* ── Left column ── */}
        <div className="profile-left-col">
          {/* Account details */}
          <div className="pcard">
            <div className="pcard-hdr"><span className="pcard-hdr-icon">👤</span><h2 className="pcard-hdr-title">Account Details</h2></div>
            <div className="pcard-body">
              {/* Name */}
              <div className="pfield">
                <span className="pfield-lbl">Full Name</span>
                {editingName ? (
                  <div className="pfield-edit-row">
                    <input className="pfield-inp" value={nameInput} autoFocus
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setEditingName(false); setNameInput(auth.name); } }} />
                    <button className="pfield-save" onClick={saveName}>Save</button>
                    <button className="pfield-discard" onClick={() => { setEditingName(false); setNameInput(auth.name); }}>✕</button>
                  </div>
                ) : (
                  <div className="pfield-view-row">
                    <span className="pfield-val">{auth.name}</span>
                    <button className="pfield-edit-btn" onClick={() => setEditingName(true)}>✏️ Edit</button>
                  </div>
                )}
              </div>
              {/* Email */}
              <div className="pfield">
                <span className="pfield-lbl">Email</span>
                <div className="pfield-view-row">
                  <span className="pfield-val">{auth.email}</span>
                  <span className="pfield-verified">✓ Verified</span>
                </div>
              </div>
              {/* City */}
              <div className="pfield" style={{ borderBottom: "none" }}>
                <span className="pfield-lbl">Delivery City</span>
                {editingCity ? (
                  <div className="pfield-edit-row">
                    <input className="pfield-inp" value={cityInput} autoFocus
                      onChange={e => setCityInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") saveCity();
                        if (e.key === "Escape") { setEditingCity(false); setCityInput(localStorage.getItem("rv_city") || "Hyderabad, Telangana"); }
                      }} />
                    <button className="pfield-save" onClick={saveCity}>Save</button>
                    <button className="pfield-discard" onClick={() => { setEditingCity(false); setCityInput(localStorage.getItem("rv_city") || "Hyderabad, Telangana"); }}>✕</button>
                  </div>
                ) : (
                  <div className="pfield-view-row">
                    <span className="pfield-val">🏙️ {cityInput}</span>
                    <button className="pfield-edit-btn" onClick={() => setEditingCity(true)}>✏️ Edit</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity stats */}
          <div className="pcard pcard-stats">
            <div className="pcard-hdr"><span className="pcard-hdr-icon">📊</span><h2 className="pcard-hdr-title">Activity</h2></div>
            <div className="pstats-grid">
              <div className="pstat-box"><span className="pstat-n">{oH.length}</span><span className="pstat-l">Orders</span></div>
              <div className="pstat-box"><span className="pstat-n">{cD.reduce((s, c) => s + c.qty, 0)}</span><span className="pstat-l">In Cart</span></div>
              <div className="pstat-box"><span className="pstat-n">{plannedCnt}</span><span className="pstat-l">Planned</span></div>
              <div className="pstat-box"><span className="pstat-n">{addresses.length}</span><span className="pstat-l">Addresses</span></div>
            </div>
          </div>

          {/* Quick links */}
          <div className="pcard">
            <div className="pcard-hdr"><span className="pcard-hdr-icon">🔗</span><h2 className="pcard-hdr-title">Quick Links</h2></div>
            <div className="pcard-body pquick-links">
              {[
                { icon: "🍽️", label: "Browse Recipes", page: "home"   },
                { icon: "🛒",  label: "My Cart",        page: "cart"   },
                { icon: "📋",  label: "Order History",  page: "orders" },
                { icon: "🗺️",  label: "Restaurant Map", page: "map"    },
              ].map(l => (
                <button key={l.page} className="pquick-btn" onClick={() => nav(l.page)}>
                  <span className="pquick-icon">{l.icon}</span>
                  <span className="pquick-label">{l.label}</span>
                  <span className="pquick-arrow">→</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sign out */}
          <div className="pcard">
            <div className="pcard-hdr"><span className="pcard-hdr-icon">⚙️</span><h2 className="pcard-hdr-title">Account Actions</h2></div>
            <div className="pcard-body">
              <p className="pdanger-desc">Signing out keeps your data saved locally.</p>
              <button className="pdanger-btn" onClick={onLogout}>↩ Sign Out</button>
            </div>
          </div>
        </div>

        {/* ── Right column (Addresses) ── */}
        <div className="profile-right-col">
          <div className="pcard paddr-card">
            <div className="pcard-hdr">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="pcard-hdr-icon">📍</span>
                <h2 className="pcard-hdr-title">Saved Addresses</h2>
                {addresses.length > 0 && <span className="paddr-count">{addresses.length}</span>}
              </div>
              {!showForm && <button className="paddr-add-btn" onClick={openAdd}>+ Add Address</button>}
            </div>

            {/* Address form */}
            {showForm && (
              <div className="paddr-form">
                <div className="paddr-form-top">
                  <span className="paddr-form-heading">{editIndex !== null ? "✏️ Edit Address" : "➕ New Address"}</span>
                  <button className="paddr-form-close" onClick={() => setShowForm(false)}>✕</button>
                </div>
                <div className="paddr-labels">
                  {ADDRESS_LABELS.map(l => (
                    <button key={l} className={`paddr-label-pill${form.label === l ? " paddr-label-pill-on" : ""}`}
                      onClick={() => ff("label", l)}>{ADDRESS_LABEL_ICONS[l]} {l}</button>
                  ))}
                </div>
                <div className="paddr-form-grid">
                  <div className="pfg pfg-half"><label className="pfg-lbl">Full Name *</label><input className={`pfg-inp${formErr.name ? " pfg-inp-err" : ""}`} placeholder="Rahul Sharma" value={form.name} onChange={e => ff("name", e.target.value)} />{formErr.name && <span className="pfg-err">{formErr.name}</span>}</div>
                  <div className="pfg pfg-half"><label className="pfg-lbl">Mobile *</label><input className={`pfg-inp${formErr.phone ? " pfg-inp-err" : ""}`} placeholder="10-digit" value={form.phone} onChange={e => ff("phone", e.target.value)} maxLength={10} />{formErr.phone && <span className="pfg-err">{formErr.phone}</span>}</div>
                  <div className="pfg pfg-full"><label className="pfg-lbl">Address Line 1 *</label><input className={`pfg-inp${formErr.line1 ? " pfg-inp-err" : ""}`} placeholder="Flat No., Building, Street" value={form.line1} onChange={e => ff("line1", e.target.value)} />{formErr.line1 && <span className="pfg-err">{formErr.line1}</span>}</div>
                  <div className="pfg pfg-full"><label className="pfg-lbl">Address Line 2 <span className="pfg-opt">(optional)</span></label><input className="pfg-inp" placeholder="Area, Colony" value={form.line2} onChange={e => ff("line2", e.target.value)} /></div>
                  <div className="pfg pfg-third"><label className="pfg-lbl">City *</label><input className={`pfg-inp${formErr.city ? " pfg-inp-err" : ""}`} placeholder="Hyderabad" value={form.city} onChange={e => ff("city", e.target.value)} />{formErr.city && <span className="pfg-err">{formErr.city}</span>}</div>
                  <div className="pfg pfg-third"><label className="pfg-lbl">State</label><input className="pfg-inp" placeholder="Telangana" value={form.state} onChange={e => ff("state", e.target.value)} /></div>
                  <div className="pfg pfg-third"><label className="pfg-lbl">PIN *</label><input className={`pfg-inp${formErr.pincode ? " pfg-inp-err" : ""}`} placeholder="500001" value={form.pincode} onChange={e => ff("pincode", e.target.value)} maxLength={6} />{formErr.pincode && <span className="pfg-err">{formErr.pincode}</span>}</div>
                  <div className="pfg pfg-full"><label className="pfg-lbl">Landmark <span className="pfg-opt">(optional)</span></label><input className="pfg-inp" placeholder="Near Metro, Opposite Park…" value={form.landmark} onChange={e => ff("landmark", e.target.value)} /></div>
                </div>
                <div className="paddr-form-actions">
                  <button className="paddr-cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
                  <button className="paddr-save-btn" onClick={submitForm}>{editIndex !== null ? "✓ Update" : "✓ Save Address"}</button>
                </div>
              </div>
            )}

            {/* Address list */}
            {!showForm && (
              <div className="paddr-list">
                {addresses.length === 0 ? (
                  <div className="paddr-empty">
                    <div className="paddr-empty-ico">🏠</div>
                    <p className="paddr-empty-title">No addresses saved</p>
                    <p className="paddr-empty-desc">Add your home or work address for faster checkout.</p>
                    <button className="paddr-add-first" onClick={openAdd}>+ Add First Address</button>
                  </div>
                ) : addresses.map((addr, idx) => (
                  <div key={addr.id} className={`paddr-item${defaultAddr === addr.id ? " paddr-item-default" : ""}`}>
                    {deleteConfirm === idx ? (
                      <div className="paddr-del-confirm">
                        <span className="paddr-del-text">Delete "{addr.label}" address?</span>
                        <div className="paddr-del-btns">
                          <button className="paddr-del-yes" onClick={() => delAddr(idx)}>Yes</button>
                          <button className="paddr-del-no" onClick={() => setDeleteConfirm(null)}>Keep</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="paddr-item-top">
                          <div className="paddr-tag">
                            <span>{ADDRESS_LABEL_ICONS[addr.label] || "📍"}</span>
                            <span className="paddr-tag-lbl">{addr.label}</span>
                          </div>
                          {defaultAddr === addr.id && <span className="paddr-default-badge">✓ Default</span>}
                          <div className="paddr-item-actions">
                            {defaultAddr !== addr.id && (
                              <button className="paddr-setdef-btn" onClick={() => persistDef(addr.id)}>Set Default</button>
                            )}
                            <button className="paddr-edit-ico" onClick={() => openEdit(idx)}>✏️</button>
                            <button className="paddr-delete-ico" onClick={() => setDeleteConfirm(idx)}>🗑️</button>
                          </div>
                        </div>
                        <div className="paddr-name">{addr.name}</div>
                        {addr.phone && <div className="paddr-phone">📞 +91 {addr.phone}</div>}
                        <div className="paddr-lines">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</div>
                        <div className="paddr-city">{addr.city}{addr.state ? `, ${addr.state}` : ""} — {addr.pincode}</div>
                        {addr.landmark && <div className="paddr-landmark">🏷️ Near: {addr.landmark}</div>}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}