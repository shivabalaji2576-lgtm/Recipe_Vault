import { CALLS_READY } from "../config";

export async function sendOrderConfirmationCall(phone, name, items) {
  if (!CALLS_READY) return { ok: false, msg: "AI Calling not ready." };

  const itemList = items.map((i) => `${i.qty} ${i.strMeal}`).join(", ");
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  try {
    const response = await fetch(`${BACKEND_URL}/call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name, items: itemList }),
    });

    const data = await response.json();
    if (response.ok) {
      return { ok: true, data };
    } else {
      const errorMsg = data.error?.message || data.error || "Call Failed";
      return { ok: false, msg: errorMsg };
    }
  } catch {
    return { ok: false, msg: "Backend Offline (Run 'node server.js' in backend folder)" };
  }
}

export default sendOrderConfirmationCall;
