import { useState } from "react";
import { loginUser, registerUser } from "../../services/api";

/* ═══════════════════════════
   LOGIN PAGE  –  Component 1
═══════════════════════════ */

export default function LoginPage({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    if (!email.includes("@") || !email.includes(".")) { setErr("Enter a valid email."); return; }
    if (pass.length < 6) { setErr("Password must be ≥ 6 characters."); return; }

    if (tab === "signup") {
      if (!name.trim()) { setErr("Please enter your name."); return; }
      if (!phone.trim()) { setErr("Please enter your phone number."); return; }
      setBusy(true);
      try {
        const data = await registerUser(email, pass, name, phone);
        localStorage.setItem("rv_token", data.token);
        onLogin(data.user);
      } catch (e) {
        setErr(e.message || "Failed to create account.");
      } finally {
        setBusy(false);
      }
    } else {
      setBusy(true);
      try {
        const data = await loginUser(email, pass);
        localStorage.setItem("rv_token", data.token);
        onLogin(data.user);
      } catch (e) {
        setErr(e.message || "Login failed.");
      } finally {
        setBusy(false);
      }
    }
  };

  return (
    <div className="login-wrap">
      {/* ── Left panel ── */}
      <div className="login-left">
        <div className="ll-brand">
          <div className="ll-logo-mk">RV</div>
          <span className="ll-logo-nm">RecipeVault</span>
        </div>
        <div className="ll-hero">
          <h1 className="ll-headline">Eat well,<br /><em>live better.</em></h1>
          <p className="ll-tagline">Healthy recipes · meal planning · instant delivery · Hyderabad.</p>
        </div>
        <div className="ll-features">
          {[
            { i: "🥗", t: "1,000+ Healthy Recipes" },
            { i: "🛒", t: "Add to Cart & Order All Together" },
            { i: "📧", t: "Direct Email Confirmation" },
            { i: "📅", t: "Breakfast · Lunch · Dinner Planner" },
            { i: "🗺️", t: "Hyderabad Restaurant Map" },
            { i: "🔒", t: "Secure JWT Authentication" },
          ].map(f => (
            <div key={f.t} className="ll-feat">
              <span className="ll-feat-ico">{f.i}</span>
              <span className="ll-feat-txt">{f.t}</span>
            </div>
          ))}
        </div>
        <div className="ll-deco">
          {["🥑", "🥦", "🍋", "🫐", "🥕", "🍎", "🥚", "🌿"].map((e, i) => (
            <span key={i} className="deco-item" style={{ animationDelay: `${i * 0.38}s` }}>{e}</span>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-tabs">
            <button className={`ltab${tab === "login" ? " ltab-on" : ""}`} onClick={() => setTab("login")}>Sign In</button>
            <button className={`ltab${tab === "signup" ? " ltab-on" : ""}`} onClick={() => setTab("signup")}>Sign Up</button>
          </div>
          <h2 className="lcard-title">{tab === "login" ? "Welcome back 👋" : "Create your account"}</h2>
          <p className="lcard-sub">{tab === "login" ? "Sign in to your meal planner." : "Start planning healthy meals today."}</p>

          {tab === "signup" && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" placeholder="Rahul Sharma"
                  value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <p style={{fontSize: '11px', color: 'var(--muted)', marginBottom: '4px'}}>Needed for AI Order Confirmation Call</p>
                <input className="form-input" type="tel" placeholder="+91 9876543210"
                  value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@email.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Min. 6 characters"
              value={pass} onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          {err && <div className="form-err">⚠ {err}</div>}

          <button className="login-submit-btn" onClick={submit} disabled={busy}>
            {busy
              ? <span className="btn-spin">◌</span>
              : tab === "login" ? "Sign In →" : "Create Account →"}
          </button>
          <p className="login-switch-p">
            {tab === "login" ? "New here? " : "Have an account? "}
            <button className="login-switch-btn" onClick={() => setTab(t => t === "login" ? "signup" : "login")}>
              {tab === "login" ? "Create account" : "Sign in"}
            </button>
          </p>
          <p className="login-storage-note">🔒 Protected with secure authentication.</p>
        </div>
      </div>
    </div>
  );
}