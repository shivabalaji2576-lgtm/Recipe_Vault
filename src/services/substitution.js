import { getSubstitutes as apiGetSubstitutes } from "./api.js";

// Client-side fallback rule table (mirrors backend for offline resilience)
export const CLIENT_SUBSTITUTION_RULES = {
  butter: [
    {
      substitute: "Olive Oil",
      ratio: "3/4 cup olive oil for 1 cup butter",
      dietary: ["Vegan", "Dairy-Free", "Heart-Healthy"],
      type: "Curated Rule",
      confidence: 0.96,
      note: "Excellent for cooking, sauteing, and moist baked goods. Lower in saturated fat.",
    },
    {
      substitute: "Ghee",
      ratio: "1:1 ratio",
      dietary: ["Lactose-Free", "Keto"],
      type: "Curated Rule",
      confidence: 0.94,
      note: "Clarified butter with higher smoke point and rich nutty flavor; lactose removed.",
    },
    {
      substitute: "Coconut Oil",
      ratio: "1:1 ratio (solid or melted)",
      dietary: ["Vegan", "Dairy-Free"],
      type: "Curated Rule",
      confidence: 0.91,
      note: "Solid at room temperature; ideal for baking and curries.",
    },
    {
      substitute: "Applesauce",
      ratio: "1/2 cup applesauce for 1 cup butter",
      dietary: ["Vegan", "Low-Fat", "Oil-Free"],
      type: "Curated Rule",
      confidence: 0.85,
      note: "Reduces fat and calories significantly in sweet baked items like muffins and cakes.",
    },
  ],
  "heavy cream": [
    {
      substitute: "Greek Yogurt + Milk",
      ratio: "1/2 cup plain Greek yogurt + 1/2 cup milk",
      dietary: ["High-Protein", "Lower-Fat"],
      type: "Curated Rule",
      confidence: 0.93,
      note: "Adds creamy richness with a protein boost and much less saturated fat.",
    },
    {
      substitute: "Coconut Cream",
      ratio: "1:1 ratio",
      dietary: ["Vegan", "Dairy-Free"],
      type: "Curated Rule",
      confidence: 0.92,
      note: "Thick, rich, and whips like dairy cream. Subtle coconut sweetness.",
    },
    {
      substitute: "Silken Tofu Puree",
      ratio: "1:1 ratio blended with water",
      dietary: ["Vegan", "Low-Fat"],
      type: "Curated Rule",
      confidence: 0.86,
      note: "Neutral flavor that thickens soups, curries, and sauces smoothly.",
    },
  ],
  milk: [
    {
      substitute: "Oat Milk",
      ratio: "1:1 ratio",
      dietary: ["Vegan", "Dairy-Free", "Nut-Free"],
      type: "Curated Rule",
      confidence: 0.97,
      note: "Creamiest plant milk, neutral taste, behaves identically in cooking and baking.",
    },
    {
      substitute: "Almond Milk",
      ratio: "1:1 ratio",
      dietary: ["Vegan", "Dairy-Free", "Low-Calorie"],
      type: "Curated Rule",
      confidence: 0.94,
      note: "Light and nutty; best with unsweetened plain varieties.",
    },
    {
      substitute: "Soy Milk",
      ratio: "1:1 ratio",
      dietary: ["Vegan", "High-Protein"],
      type: "Curated Rule",
      confidence: 0.95,
      note: "Protein content matches cow milk; excellent for savory sauces.",
    },
  ],
  egg: [
    {
      substitute: "Flax Egg",
      ratio: "1 tbsp ground flaxseed + 3 tbsp warm water (per egg)",
      dietary: ["Vegan", "Gluten-Free", "High-Fiber"],
      type: "Curated Rule",
      confidence: 0.94,
      note: "Let stand 5 mins to thicken. Outstanding binder for pancakes, brownies, and cookies.",
    },
    {
      substitute: "Chia Egg",
      ratio: "1 tbsp chia seeds + 3 tbsp water (per egg)",
      dietary: ["Vegan", "Omega-3 Rich"],
      type: "Curated Rule",
      confidence: 0.92,
      note: "Gel-like binding consistency, loaded with soluble fiber.",
    },
    {
      substitute: "Silken Tofu",
      ratio: "1/4 cup pureed tofu per egg",
      dietary: ["Vegan", "High-Protein"],
      type: "Curated Rule",
      confidence: 0.88,
      note: "Creates moist, dense crumb in baked goods and quiches.",
    },
    {
      substitute: "Mashed Banana",
      ratio: "1/2 ripe banana per egg",
      dietary: ["Vegan", "Natural"],
      type: "Curated Rule",
      confidence: 0.86,
      note: "Provides binding and moisture; adds natural sweetness and mild banana aroma.",
    },
  ],
  "all-purpose flour": [
    {
      substitute: "Almond Flour",
      ratio: "1:1 ratio (by weight or slightly less by volume)",
      dietary: ["Gluten-Free", "Low-Carb", "Keto"],
      type: "Curated Rule",
      confidence: 0.91,
      note: "Moist, tender crumb and nutty flavor with minimal glycemic impact.",
    },
    {
      substitute: "Oat Flour",
      ratio: "1:1 ratio",
      dietary: ["Gluten-Free", "Whole-Grain"],
      type: "Curated Rule",
      confidence: 0.92,
      note: "Subtle sweet grain flavor; easily made by grinding rolled oats.",
    },
    {
      substitute: "1:1 Gluten-Free Baking Blend",
      ratio: "1:1 ratio",
      dietary: ["Gluten-Free"],
      type: "Curated Rule",
      confidence: 0.96,
      note: "Formulated with xanthan gum to mimic wheat flour elasticity directly.",
    },
  ],
  sugar: [
    {
      substitute: "Honey",
      ratio: "3/4 cup honey per 1 cup sugar (reduce liquid by 2 tbsp)",
      dietary: ["Natural", "Unrefined"],
      type: "Curated Rule",
      confidence: 0.94,
      note: "Adds floral depth and keeps baked goods moist longer.",
    },
    {
      substitute: "Maple Syrup",
      ratio: "3/4 cup maple syrup per 1 cup sugar",
      dietary: ["Vegan", "Mineral-Rich"],
      type: "Curated Rule",
      confidence: 0.93,
      note: "Complex caramel notes, perfect for sauces, dressings, and baking.",
    },
    {
      substitute: "Stevia / Monk Fruit Blend",
      ratio: "1:1 baking measurement",
      dietary: ["Zero-Calorie", "Keto", "Diabetic-Friendly"],
      type: "Curated Rule",
      confidence: 0.90,
      note: "Zero blood sugar spike; ideal for low-carb nutrition.",
    },
  ],
  "soy sauce": [
    {
      substitute: "Tamari",
      ratio: "1:1 ratio",
      dietary: ["Gluten-Free"],
      type: "Curated Rule",
      confidence: 0.98,
      note: "Traditional brewed liquid from miso; richer, deeper umami, naturally wheat-free.",
    },
    {
      substitute: "Coconut Aminos",
      ratio: "1:1 ratio (add pinch of salt if needed)",
      dietary: ["Soy-Free", "Lower-Sodium", "Paleo"],
      type: "Curated Rule",
      confidence: 0.93,
      note: "Made from aged coconut sap; 70% less sodium with mild sweet-savory finish.",
    },
  ],
  parmesan: [
    {
      substitute: "Nutritional Yeast",
      ratio: "1:1 ratio",
      dietary: ["Vegan", "Dairy-Free", "B-Vitamins"],
      type: "Curated Rule",
      confidence: 0.92,
      note: "Savory, nutty, cheesy flakes packed with complete protein and B12.",
    },
    {
      substitute: "Pecorino Romano",
      ratio: "1:1 ratio",
      dietary: ["Sheep-Milk"],
      type: "Curated Rule",
      confidence: 0.95,
      note: "Sharper, saltier Italian hard cheese that grates identically.",
    },
  ],
  mayonnaise: [
    {
      substitute: "Greek Yogurt",
      ratio: "1:1 ratio",
      dietary: ["High-Protein", "Low-Fat"],
      type: "Curated Rule",
      confidence: 0.94,
      note: "Thick and tangy, cuts calories by 75% while boosting gut-healthy probiotics.",
    },
    {
      substitute: "Mashed Avocado",
      ratio: "1:1 ratio",
      dietary: ["Vegan", "Heart-Healthy Fats"],
      type: "Curated Rule",
      confidence: 0.89,
      note: "Silky texture with monounsaturated fats, potassium, and vibrant green color.",
    },
  ],
  chicken: [
    {
      substitute: "Tofu (Extra Firm)",
      ratio: "1:1 ratio pressed and cubed",
      dietary: ["Vegan", "High-Protein", "Low-Calorie"],
      type: "Curated Rule",
      confidence: 0.93,
      note: "Absorbs marinades and spices beautifully; crisps up when pan-fried or baked.",
    },
    {
      substitute: "Paneer",
      ratio: "1:1 ratio cubed",
      dietary: ["Vegetarian", "High-Calcium"],
      type: "Curated Rule",
      confidence: 0.92,
      note: "Traditional Indian fresh cottage cheese that holds its shape under high heat.",
    },
    {
      substitute: "Chickpeas",
      ratio: "1 cup cooked chickpeas per 200g chicken",
      dietary: ["Vegan", "High-Fiber"],
      type: "Curated Rule",
      confidence: 0.88,
      note: "Hearty legume texture that thrives in curries, salads, and stews.",
    },
  ],
  beef: [
    {
      substitute: "Brown Lentils",
      ratio: "1:1 cooked volume ratio",
      dietary: ["Vegan", "High-Fiber", "Zero-Cholesterol"],
      type: "Curated Rule",
      confidence: 0.91,
      note: "Earthy, robust texture that mimics ground beef in bolognese, tacos, and chili.",
    },
    {
      substitute: "Portobello Mushrooms",
      ratio: "1:1 chopped or minced",
      dietary: ["Vegan", "Low-Calorie", "Umami-Rich"],
      type: "Curated Rule",
      confidence: 0.90,
      note: "Dense, meaty chew packed with natural glutamates for savory depth.",
    },
  ],
  rice: [
    {
      substitute: "Cauliflower Rice",
      ratio: "1:1 ratio",
      dietary: ["Keto", "Low-Carb", "Grain-Free"],
      type: "Curated Rule",
      confidence: 0.94,
      note: "85% fewer calories and carbs; quick 3-minute saute preserves tender bite.",
    },
    {
      substitute: "Quinoa",
      ratio: "1:1 cooked ratio",
      dietary: ["Gluten-Free", "Complete-Protein"],
      type: "Curated Rule",
      confidence: 0.93,
      note: "Fluffy ancient grain with all 9 essential amino acids and nutty finish.",
    },
  ],
  pasta: [
    {
      substitute: "Zucchini Noodles (Zoodles)",
      ratio: "1:1 volume ratio",
      dietary: ["Keto", "Low-Carb", "Raw-Friendly"],
      type: "Curated Rule",
      confidence: 0.92,
      note: "Light and hydrating; toss gently in warm sauce without boiling to keep crisp.",
    },
    {
      substitute: "Chickpea Pasta",
      ratio: "1:1 ratio",
      dietary: ["Gluten-Free", "High-Protein", "High-Fiber"],
      type: "Curated Rule",
      confidence: 0.95,
      note: "Authentic al dente pasta chew with twice the protein and fiber of wheat pasta.",
    },
  ],
  garlic: [
    {
      substitute: "Garlic Powder",
      ratio: "1/8 tsp powder per 1 fresh clove",
      dietary: ["Pantry-Staple"],
      type: "Curated Rule",
      confidence: 0.95,
      note: "Concentrated dehydrated garlic; disperses evenly in rubs and marinades.",
    },
    {
      substitute: "Shallots",
      ratio: "1 small shallot per 2 cloves garlic",
      dietary: ["Fresh", "Mild"],
      type: "Curated Rule",
      confidence: 0.88,
      note: "Delicate onion-garlic hybrid profile with aromatic sweetness.",
    },
    {
      substitute: "Asafoetida (Hing)",
      ratio: "Tiny pinch (1/16 tsp) cooked in oil",
      dietary: ["Digestive", "Jain-Friendly"],
      type: "Curated Rule",
      confidence: 0.86,
      note: "Indian resin powder that releases pungent allium aromatics when tempered.",
    },
  ],
};

const CLIENT_EMBEDDINGS = {
  butter:            [0.85, 0.15, 0.05, 0.20, 0.05, 0.00, 0.00, 0.05, 0.60, 0.90, 0.85, 0.70],
  "olive oil":       [0.98, 0.02, 0.00, 0.15, 0.05, 0.00, 0.00, 0.00, 0.30, 0.60, 0.95, 0.60],
  "coconut oil":     [0.95, 0.05, 0.15, 0.05, 0.00, 0.00, 0.00, 0.00, 0.40, 0.80, 0.85, 0.50],
  "ghee":            [0.98, 0.02, 0.05, 0.25, 0.00, 0.00, 0.00, 0.00, 0.40, 0.75, 0.95, 0.65],
  "vegetable oil":   [0.99, 0.01, 0.00, 0.05, 0.00, 0.00, 0.00, 0.00, 0.25, 0.70, 0.95, 0.50],
  "heavy cream":     [0.40, 0.55, 0.10, 0.15, 0.05, 0.00, 0.02, 0.05, 0.50, 0.70, 0.30, 0.95],
  "greek yogurt":    [0.10, 0.75, 0.08, 0.10, 0.35, 0.00, 0.04, 0.35, 0.55, 0.50, 0.10, 0.80],
  "coconut cream":   [0.35, 0.55, 0.20, 0.05, 0.02, 0.00, 0.05, 0.05, 0.45, 0.70, 0.20, 0.90],
  milk:              [0.05, 0.88, 0.10, 0.05, 0.02, 0.00, 0.05, 0.10, 0.20, 0.80, 0.05, 0.60],
  "oat milk":        [0.03, 0.88, 0.12, 0.05, 0.02, 0.00, 0.08, 0.05, 0.20, 0.80, 0.05, 0.60],
  "almond milk":     [0.03, 0.92, 0.05, 0.02, 0.02, 0.00, 0.02, 0.05, 0.15, 0.70, 0.05, 0.50],
  "soy milk":        [0.04, 0.88, 0.08, 0.05, 0.02, 0.00, 0.04, 0.15, 0.25, 0.75, 0.05, 0.60],
  egg:               [0.20, 0.70, 0.00, 0.20, 0.00, 0.00, 0.01, 0.35, 0.95, 0.95, 0.40, 0.50],
  "flax egg":        [0.15, 0.75, 0.00, 0.05, 0.00, 0.00, 0.10, 0.10, 0.90, 0.85, 0.10, 0.40],
  "silken tofu":     [0.05, 0.80, 0.02, 0.10, 0.02, 0.00, 0.02, 0.30, 0.75, 0.60, 0.15, 0.75],
  "all-purpose flour":[0.02, 0.10, 0.02, 0.05, 0.00, 0.00, 0.85, 0.15, 0.75, 0.98, 0.10, 0.65],
  "almond flour":    [0.50, 0.05, 0.05, 0.05, 0.00, 0.00, 0.15, 0.30, 0.40, 0.85, 0.10, 0.30],
  "oat flour":       [0.08, 0.10, 0.05, 0.05, 0.00, 0.00, 0.75, 0.20, 0.60, 0.90, 0.10, 0.50],
  sugar:             [0.00, 0.01, 0.99, 0.00, 0.00, 0.00, 0.10, 0.00, 0.20, 0.90, 0.05, 0.40],
  honey:             [0.00, 0.18, 0.95, 0.02, 0.05, 0.00, 0.05, 0.01, 0.40, 0.80, 0.05, 0.50],
  "maple syrup":     [0.00, 0.30, 0.90, 0.05, 0.03, 0.00, 0.05, 0.01, 0.30, 0.80, 0.05, 0.50],
  "soy sauce":       [0.00, 0.70, 0.05, 0.90, 0.10, 0.00, 0.05, 0.15, 0.00, 0.10, 0.30, 0.80],
  tamari:            [0.00, 0.68, 0.05, 0.92, 0.10, 0.00, 0.05, 0.18, 0.00, 0.10, 0.30, 0.85],
  "coconut aminos":  [0.00, 0.70, 0.20, 0.75, 0.08, 0.00, 0.10, 0.05, 0.00, 0.10, 0.25, 0.75],
  parmesan:          [0.35, 0.25, 0.00, 0.85, 0.10, 0.00, 0.02, 0.55, 0.30, 0.40, 0.10, 0.60],
  "nutritional yeast":[0.05, 0.05, 0.02, 0.80, 0.05, 0.00, 0.15, 0.65, 0.20, 0.30, 0.05, 0.50],
  chicken:           [0.08, 0.65, 0.00, 0.60, 0.00, 0.00, 0.00, 0.85, 0.10, 0.10, 0.85, 0.20],
  tofu:              [0.10, 0.70, 0.00, 0.30, 0.02, 0.00, 0.05, 0.50, 0.30, 0.20, 0.75, 0.30],
  paneer:            [0.25, 0.55, 0.02, 0.40, 0.05, 0.00, 0.05, 0.45, 0.30, 0.20, 0.80, 0.30],
  beef:              [0.20, 0.55, 0.00, 0.85, 0.00, 0.00, 0.00, 0.80, 0.20, 0.10, 0.90, 0.30],
  lentils:           [0.02, 0.65, 0.02, 0.50, 0.00, 0.00, 0.55, 0.40, 0.30, 0.10, 0.40, 0.50],
  mushrooms:         [0.01, 0.85, 0.01, 0.75, 0.02, 0.00, 0.05, 0.15, 0.10, 0.05, 0.80, 0.40],
  rice:              [0.01, 0.65, 0.02, 0.05, 0.00, 0.00, 0.85, 0.08, 0.30, 0.05, 0.20, 0.10],
  "cauliflower rice":[0.01, 0.88, 0.05, 0.10, 0.02, 0.00, 0.15, 0.05, 0.05, 0.05, 0.40, 0.10],
  quinoa:            [0.04, 0.65, 0.02, 0.10, 0.00, 0.00, 0.70, 0.20, 0.25, 0.10, 0.25, 0.20],
  pasta:             [0.02, 0.60, 0.02, 0.05, 0.00, 0.00, 0.85, 0.12, 0.30, 0.05, 0.10, 0.20],
  "zucchini noodles":[0.01, 0.92, 0.05, 0.05, 0.02, 0.00, 0.08, 0.04, 0.05, 0.00, 0.30, 0.15],
  garlic:            [0.01, 0.65, 0.10, 0.75, 0.05, 0.40, 0.25, 0.10, 0.05, 0.10, 0.85, 0.60],
  shallots:          [0.01, 0.75, 0.15, 0.65, 0.05, 0.25, 0.20, 0.08, 0.05, 0.10, 0.85, 0.60],
  "garlic powder":   [0.01, 0.05, 0.10, 0.80, 0.05, 0.35, 0.35, 0.15, 0.05, 0.10, 0.70, 0.70],
};

function cosineSimilarity(a, b) {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function normalizeName(name) {
  if (!name || typeof name !== "string") return "";
  const cleaned = name.toLowerCase().trim().replace(/[-_]/g, " ").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
  if (cleaned === "all purpose flour" || cleaned === "flour" || cleaned === "plain flour") {
    return "all-purpose flour";
  }
  return cleaned;
}

function capitalize(str) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Client fallback lookup when backend is unreachable
 */
export function getClientFallbackSubstitutes(rawIngredient) {
  const norm = normalizeName(rawIngredient);
  const results = [];
  const seen = new Set();

  let directRules = CLIENT_SUBSTITUTION_RULES[norm];
  if (!directRules) {
    for (const key of Object.keys(CLIENT_SUBSTITUTION_RULES)) {
      if (norm.includes(key) || key.includes(norm)) {
        directRules = CLIENT_SUBSTITUTION_RULES[key];
        break;
      }
    }
  }

  if (directRules) {
    for (const r of directRules) {
      seen.add(r.substitute.toLowerCase());
      results.push({ ...r, matchType: "Curated Rule" });
    }
  }

  // Vector similarity
  const targetVector = CLIENT_EMBEDDINGS[norm] || (() => {
    for (const k of Object.keys(CLIENT_EMBEDDINGS)) {
      if (norm.includes(k) || k.includes(norm)) return CLIENT_EMBEDDINGS[k];
    }
    return null;
  })();

  if (targetVector) {
    const scored = [];
    for (const [candidate, vector] of Object.entries(CLIENT_EMBEDDINGS)) {
      if (candidate === norm || seen.has(candidate)) continue;
      const score = cosineSimilarity(targetVector, vector);
      if (score >= 0.72) {
        scored.push({ candidate, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    for (const item of scored.slice(0, 3)) {
      if (!seen.has(item.candidate)) {
        seen.add(item.candidate);
        results.push({
          substitute: capitalize(item.candidate),
          ratio: "1:1 equivalent culinary profile",
          dietary: ["Semantic Match"],
          type: "Embedding Similarity",
          confidence: Math.round(item.score * 100) / 100,
          note: `High semantic affinity (${Math.round(item.score * 100)}% match) based on fat, moisture, protein, and cooking utility.`,
          matchType: "Embedding Match",
        });
      }
    }
  }

  return {
    ingredient: rawIngredient,
    substitutes: results,
  };
}

/**
 * Fetch ingredient substitutes from backend with automatic local fallback
 */
export async function fetchIngredientSubstitutes(ingredientName) {
  try {
    const data = await apiGetSubstitutes(ingredientName);
    if (data?.substitutes && data.substitutes.length > 0) {
      return data.substitutes;
    }
  } catch {
    // Fallback if backend is unavailable
  }
  const fallback = getClientFallbackSubstitutes(ingredientName);
  return fallback.substitutes;
}
