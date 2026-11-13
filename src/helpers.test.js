import { describe, it, expect } from "vitest";
import { fmt, getPrice, getIngredientPrice, calculateCartTotal } from "./helpers";

describe("fmt (Currency Formatter)", () => {
  it("formats integer amounts in Indian Rupee format", () => {
    expect(fmt(149)).toBe("₹149");
    expect(fmt(500)).toBe("₹500");
  });

  it("applies thousand and lakh separators correctly according to en-IN locale", () => {
    expect(fmt(1000)).toBe("₹1,000");
    expect(fmt(10000)).toBe("₹10,000");
    expect(fmt(100000)).toBe("₹1,00,000");
  });

  it("handles zero gracefully", () => {
    expect(fmt(0)).toBe("₹0");
  });

  it("handles null, undefined, or empty values by falling back to 0", () => {
    expect(fmt(null)).toBe("₹0");
    expect(fmt(undefined)).toBe("₹0");
    expect(fmt("")).toBe("₹0");
  });
});

describe("getPrice (Deterministic Recipe Pricing)", () => {
  it("produces deterministic prices for the same meal ID", () => {
    const mealA = { idMeal: "52772", strMeal: "Teriyaki Chicken" };
    const price1 = getPrice(mealA);
    const price2 = getPrice(mealA);
    expect(price1).toBe(price2);
  });

  it("supports both idMeal and id properties", () => {
    const byIdMeal = getPrice({ idMeal: "12345" });
    const byId = getPrice({ id: "12345" });
    expect(byIdMeal).toBe(byId);
  });

  it("ensures meal prices fall strictly within ₹149 to ₹649 in increments of ₹50", () => {
    const testIds = ["1", "52772", "99999", "abc", "meal_001", "777", ""];
    for (const id of testIds) {
      const price = getPrice({ idMeal: id });
      expect(price).toBeGreaterThanOrEqual(149);
      expect(price).toBeLessThanOrEqual(649);
      expect((price - 149) % 50).toBe(0);
    }
  });

  it("handles null or undefined meal input without throwing", () => {
    expect(() => getPrice(null)).not.toThrow();
    expect(() => getPrice(undefined)).not.toThrow();
    expect(() => getPrice({})).not.toThrow();
    const fallbackPrice = getPrice(null);
    expect(fallbackPrice).toBeGreaterThanOrEqual(149);
    expect(fallbackPrice).toBeLessThanOrEqual(649);
  });
});

describe("getIngredientPrice (Deterministic Ingredient Pricing)", () => {
  it("produces deterministic prices for the same ingredient name", () => {
    const p1 = getIngredientPrice("Olive Oil");
    const p2 = getIngredientPrice("Olive Oil");
    expect(p1).toBe(p2);
  });

  it("ensures ingredient prices fall strictly within ₹29 to ₹119 in increments of ₹10", () => {
    const ingredients = [
      "Butter",
      "Olive Oil",
      "Garlic",
      "Soy Sauce",
      "Chicken Breast",
      "Heavy Cream",
      "Flour",
      "",
    ];
    for (const ing of ingredients) {
      const price = getIngredientPrice(ing);
      expect(price).toBeGreaterThanOrEqual(29);
      expect(price).toBeLessThanOrEqual(119);
      expect((price - 29) % 10).toBe(0);
    }
  });

  it("handles null and undefined ingredient names safely", () => {
    expect(() => getIngredientPrice(null)).not.toThrow();
    expect(() => getIngredientPrice(undefined)).not.toThrow();
    const pNull = getIngredientPrice(null);
    expect(pNull).toBeGreaterThanOrEqual(29);
    expect(pNull).toBeLessThanOrEqual(119);
  });
});

describe("calculateCartTotal (Cart Total & Delivery Calculation)", () => {
  it("returns only the default delivery fee (₹49) when the cart is empty", () => {
    expect(calculateCartTotal([])).toBe(49);
  });

  it("returns the custom delivery fee when cart is empty", () => {
    expect(calculateCartTotal([], 0)).toBe(0);
    expect(calculateCartTotal([], 99)).toBe(99);
  });

  it("handles non-array inputs safely by returning the delivery fee", () => {
    expect(calculateCartTotal(null)).toBe(49);
    expect(calculateCartTotal(undefined)).toBe(49);
    expect(calculateCartTotal("invalid")).toBe(49);
  });

  it("calculates total for items with explicit price and qty", () => {
    const items = [
      { idMeal: "1", strMeal: "Biryani", price: 299, qty: 2 }, // 598
      { idMeal: "2", strMeal: "Raita", price: 79, qty: 1 },    // 79
    ];
    // Subtotal: 598 + 79 = 677. Delivery: 49. Total: 726
    expect(calculateCartTotal(items)).toBe(726);
  });

  it("falls back to getPrice(item) when explicit price is absent", () => {
    const item = { idMeal: "52772", strMeal: "Teriyaki Chicken", qty: 1 };
    const expectedSubtotal = getPrice(item);
    expect(calculateCartTotal([item], 49)).toBe(expectedSubtotal + 49);
  });

  it("defaults qty to 1 when qty is omitted or undefined", () => {
    const items = [{ idMeal: "1", strMeal: "Salad", price: 150 }];
    expect(calculateCartTotal(items, 49)).toBe(150 + 49);
  });

  it("respects custom delivery fee parameter with multiple items", () => {
    const items = [
      { idMeal: "1", price: 200, qty: 3 }, // 600
    ];
    expect(calculateCartTotal(items, 0)).toBe(600);
    expect(calculateCartTotal(items, 100)).toBe(700);
  });
});

