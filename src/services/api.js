const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function getToken() {
  try {
    return localStorage.getItem("rv_token");
  } catch {
    return null;
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data?.error || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ── Auth APIs ──
export async function loginUser(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(email, password, name, phone) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name, phone }),
  });
}

export async function getMe() {
  return request("/auth/me");
}

export async function updateProfile(name, phone) {
  return request("/auth/profile", {
    method: "PUT",
    body: JSON.stringify({ name, phone }),
  });
}

// ── Cart APIs ──
export async function getCart() {
  const data = await request("/api/cart");
  return data.cart || [];
}

export async function saveCart(cart) {
  const data = await request("/api/cart", {
    method: "PUT",
    body: JSON.stringify({ cart }),
  });
  return data.cart || [];
}

// ── Order APIs ──
export async function getOrders() {
  const data = await request("/api/orders");
  return data.orders || [];
}

export async function createOrder(order) {
  const data = await request("/api/orders", {
    method: "POST",
    body: JSON.stringify({ order }),
  });
  return data.order;
}

// ── Meal Plan APIs ──
export async function getMealPlan() {
  const data = await request("/api/mealplan");
  return { mealPlan: data.mealPlan, autoOn: data.autoOn };
}

export async function saveMealPlan(mealPlan, autoOn) {
  const data = await request("/api/mealplan", {
    method: "PUT",
    body: JSON.stringify({ mealPlan, autoOn }),
  });
  return { mealPlan: data.mealPlan, autoOn: data.autoOn };
}

// ── Address APIs ──
export async function getAddresses() {
  const data = await request("/api/addresses");
  return { addresses: data.addresses || [], defaultAddr: data.defaultAddr || "" };
}

export async function saveAddresses(addresses, defaultAddr) {
  const data = await request("/api/addresses", {
    method: "PUT",
    body: JSON.stringify({ addresses, defaultAddr }),
  });
  return { addresses: data.addresses || [], defaultAddr: data.defaultAddr || "" };
}

// ── Chatbot & Call APIs ──
export async function chatWithBot(message, history) {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ message, history }),
  });
}

export async function triggerCall(phone, name, items) {
  return request("/call", {
    method: "POST",
    body: JSON.stringify({ phone, name, items }),
  });
}

// ── Ingredient Substitution API (Option A) ──
export async function getSubstitutes(ingredient) {
  return request(`/api/substitutes?ingredient=${encodeURIComponent(ingredient)}`);
}
