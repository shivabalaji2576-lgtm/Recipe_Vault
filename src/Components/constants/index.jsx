import { createContext, useState, useEffect } from "react";

/* ── EmailJS / Chatbot config ── */
export const EMAILJS_READY       = true;
export const EMAILJS_SERVICE_ID  = "service_d8yxujd";
export const EMAILJS_TEMPLATE_ID = "template_4bevwdq";
export const EMAILJS_PUBLIC_KEY  = "uROi0slekYnsMKRJ6";
export const CHATBOT_READY       = true;
export const GEMINI_API_KEY      = "AIzaSyD6iPQtdoMd_nbRijeMKLccgVpJgKihEuk";
export const GEMINI_MODEL        = "gemini-2.0-flash";

/* ── App constants ── */
export const API        = "https://www.themealdb.com/api/json/v1/1";
export const DAYS       = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
export const SHORT      = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
export const MEAL_TYPES = ["Breakfast","Lunch","Dinner"];
export const MEAL_ICONS = { Breakfast:"🌅", Lunch:"☀️", Dinner:"🌙" };
export const HC         = ["Vegetarian","Vegan","Seafood","Chicken","Miscellaneous","Side","Starter"];
export const LOAD_CATS  = ["Vegetarian","Chicken","Seafood","Side","Pasta","Lamb","Beef","Pork"];
export const DELIVERY   = 49;
export const ADDRESS_LABELS      = ["Home","Work","Other"];
export const ADDRESS_LABEL_ICONS = { Home:"🏠", Work:"💼", Other:"📍" };

export const RESTAURANTS = [
  { id:1, name:"Paradise Biryani", color:"#C0392B", cuisine:"Hyderabadi Biryani",     rating:4.8, addr:"MG Road, Secunderabad",   hrs:"11am–11pm", lat:17.4399, lng:78.4983 },
  { id:2, name:"Chutneys",         color:"#2A7040", cuisine:"South Indian Veg",        rating:4.6, addr:"Banjara Hills, Hyderabad", hrs:"7am–10pm",  lat:17.4126, lng:78.4484 },
  { id:3, name:"Bawarchi",         color:"#E07A35", cuisine:"Hyderabadi & Mughlai",    rating:4.5, addr:"RTC Cross Roads",          hrs:"11am–11pm", lat:17.3962, lng:78.4796 },
  { id:4, name:"Eat Street",       color:"#5050C0", cuisine:"Multi-Cuisine & Healthy", rating:4.3, addr:"Necklace Road, Hyderabad", hrs:"6pm–11pm",  lat:17.4062, lng:78.4691 },
  { id:5, name:"Hotel Shadab",     color:"#A03030", cuisine:"Haleem & Mughlai",        rating:4.7, addr:"High Court, Old City",     hrs:"7am–11pm",  lat:17.3616, lng:78.4747 },
  { id:6, name:"Ohri's Dum Pukht", color:"#C07820", cuisine:"Mughlai & Healthy Bowl",  rating:4.4, addr:"Somajiguda, Hyderabad",    hrs:"12pm–11pm", lat:17.4239, lng:78.4528 },
];

/* ── Helpers ── */
export const fmt = n => `₹${n.toLocaleString("en-IN")}`;

export function getPrice(meal) {
  const id = String(meal?.idMeal || meal?.id || "0");
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 149 + (h % 11) * 50;
}

export function getIngredientPrice(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) >>> 0;
  return 29 + (h % 10) * 10;
}

export function useDebounce(v, d) {
  const [s, ss] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => ss(v), d);
    return () => clearTimeout(t);
  }, [v, d]);
  return s;
}

/* ── Shared React Context ── */
export const Ctx = createContext();

/* ── Email utilities ── */
export async function sendDirectEmail(toEmail, toName, subject, htmlBody) {
  if (!EMAILJS_READY) return { ok: false, msg: "EmailJS not configured." };
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: { to_email: toEmail, to_name: toName, subject, message: htmlBody },
      }),
    });
    return res.ok ? { ok: true } : { ok: false, msg: await res.text() };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
}

export function buildOrderEmail(auth, items) {
  const sub   = items.reduce((s, o) => s + o.qty * (o.price || getPrice(o)), 0);
  const total = sub + DELIVERY;
  const now   = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", day: "numeric", month: "long",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const rows = items.map(o => {
    const p = o.price || getPrice(o);
    return `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e8f0e0;font-size:15px;color:#0f2010;">${o.strMeal}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e8f0e0;text-align:center;">${o.qty}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e8f0e0;text-align:right;font-weight:600;color:#2a7040;">Rs.${(o.qty * p).toLocaleString("en-IN")}</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4faf0;font-family:Arial,sans-serif;">
<table width="100%" style="background:#f4faf0;padding:30px 0;"><tr><td align="center">
<table width="560" style="background:#fff;border-radius:14px;overflow:hidden;border:1px solid #cce5c4;">
<tr><td style="background:#2a7040;padding:28px 32px;text-align:center;">
  <h1 style="margin:0;color:#fff;font-size:22px;">RecipeVault</h1>
  <p style="margin:6px 0 0;color:#a8e6b8;font-size:13px;">Hyderabad · Healthy Living</p>
</td></tr>
<tr><td style="background:#e8f8e8;padding:18px 32px;text-align:center;border-bottom:1px solid #b8e8b8;">
  <p style="margin:0;font-size:26px;">✓</p>
  <h2 style="margin:6px 0 0;color:#2a7040;font-size:18px;">Order Placed Successfully!</h2>
</td></tr>
<tr><td style="padding:24px 32px 0;">
  <p style="margin:0;font-size:16px;color:#0f2010;">Namaste <strong>${auth.name}</strong>! 🌿</p>
</td></tr>
<tr><td style="padding:20px 32px 0;">
  <table width="100%" style="border:1px solid #cce5c4;border-radius:10px;overflow:hidden;">
    <tr style="background:#ebf5e5;">
      <th style="padding:10px 12px;text-align:left;font-size:12px;color:#5a7055;text-transform:uppercase;">Item</th>
      <th style="padding:10px 12px;text-align:center;font-size:12px;color:#5a7055;text-transform:uppercase;">Qty</th>
      <th style="padding:10px 12px;text-align:right;font-size:12px;color:#5a7055;text-transform:uppercase;">Price</th>
    </tr>${rows}
  </table>
</td></tr>
<tr><td style="padding:16px 32px 0;">
  <table width="100%" style="background:#f4faf0;border-radius:10px;padding:16px 18px;border:1px solid #cce5c4;">
    <tr><td style="padding:5px 0;font-size:14px;color:#5a7055;">Subtotal</td><td style="padding:5px 0;text-align:right;color:#5a7055;">Rs.${sub.toLocaleString("en-IN")}</td></tr>
    <tr><td style="padding:5px 0;font-size:14px;color:#5a7055;">Delivery</td><td style="padding:5px 0;text-align:right;color:#5a7055;">Rs.${DELIVERY}</td></tr>
    <tr><td colspan="2" style="border-top:1px solid #cce5c4;padding-top:10px;"></td></tr>
    <tr><td style="font-size:17px;font-weight:700;color:#0f2010;">Total</td><td style="text-align:right;font-size:20px;font-weight:700;color:#2a7040;">Rs.${total.toLocaleString("en-IN")}</td></tr>
  </table>
</td></tr>
<tr><td style="padding:18px 32px 0;">
  <table width="100%" style="background:#fff8e5;border-radius:10px;border:1px solid #f0d888;">
    <tr><td style="padding:12px 16px;">
      <p style="margin:0;font-size:13px;color:#806020;">📍 Delivery: Hyderabad, Telangana</p>
      <p style="margin:6px 0 0;font-size:13px;color:#806020;">🕐 Ordered: ${now} (IST)</p>
      <p style="margin:6px 0 0;font-size:13px;color:#806020;">⏰ ETA: 30–45 minutes</p>
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding:24px 32px 28px;text-align:center;">
  <p style="margin:0;font-size:15px;color:#0f2010;">Thank you for choosing healthy food! 😊</p>
  <p style="margin:12px 0 0;font-size:12px;color:#a0b8a0;">— RecipeVault Team, Hyderabad 🌿</p>
</td></tr>
</table></td></tr></table></body></html>`;

  return {
    subject: `Order Confirmed — RecipeVault — Rs.${total.toLocaleString("en-IN")}`,
    body: html,
  };
}