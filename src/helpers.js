/* ── Helper Functions ── */

export const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export function getPrice(meal) {
  const id = String(meal?.idMeal || meal?.id || "0");
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return 149 + (h % 11) * 50;
}

export function getIngredientPrice(name) {
  const str = String(name || "");
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return 29 + (h % 10) * 10;
}

export function calculateCartTotal(items, deliveryFee = 49) {
  if (!Array.isArray(items)) return deliveryFee;
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.qty || 1) * Number(item.price || getPrice(item)),
    0
  );
  return subtotal + deliveryFee;
}
