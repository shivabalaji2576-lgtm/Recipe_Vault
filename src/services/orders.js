import { buildOrderEmail, sendDirectEmail } from "./email";
import { sendOrderConfirmationCall } from "./orderCall";
import { createOrder } from "./api";
import { getPrice } from "../helpers";
import { DELIVERY, DAYS } from "../config";

export async function placeUserOrder({ auth, items }) {
  if (!items || !items.length) {
    return { ok: false, msg: "No items to order." };
  }

  const { subject, body } = buildOrderEmail(auth, items);
  const emailResult = await sendDirectEmail(auth.email, auth.name, subject, body);

  const total = items.reduce((s, c) => s + c.qty * (c.price || getPrice(c)), 0) + DELIVERY;
  const orderRecord = {
    id: `ord_${Date.now()}`,
    items: [...items],
    total,
    date: new Date().toISOString(),
  };

  let orderSaved = true;
  try {
    await createOrder(orderRecord);
  } catch (err) {
    console.error("Failed to save order to server:", err);
    orderSaved = false;
  }

  let callResult = null;
  if (auth.phone) {
    callResult = await sendOrderConfirmationCall(auth.phone, auth.name, items);
  }

  return {
    ok: true,
    order: orderRecord,
    orderSaved,
    emailResult,
    callResult,
  };
}

export function getTodayMeals(mealPlan) {
  if (!mealPlan) return { today: "", meals: [] };
  const di = new Date().getDay();
  const today = DAYS[di === 0 ? 6 : di - 1];
  const dayPlan = mealPlan[today] || {};
  const meals = Object.values(dayPlan).filter(Boolean);
  return { today, meals };
}
