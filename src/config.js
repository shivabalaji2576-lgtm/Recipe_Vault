/* ── Application Configuration & Constants ── */
export const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "";
export const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "";
export const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "";
export const EMAILJS_READY = Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
export const CHATBOT_READY = true;
export const CALLS_READY = true;

export const API = "https://www.themealdb.com/api/json/v1/1";
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];
export const MEAL_ICONS = { Breakfast: "🌅", Lunch: "☀️", Dinner: "🌙" };
export const HC = ["Vegetarian", "Vegan", "Seafood", "Chicken", "Miscellaneous", "Side", "Starter"];
export const LOAD_CATS = ["Vegetarian", "Chicken", "Seafood", "Side", "Pasta", "Lamb", "Beef", "Pork"];
export const DELIVERY = 49;
export const ADDRESS_LABELS = ["Home", "Work", "Other"];
export const ADDRESS_LABEL_ICONS = { Home: "🏠", Work: "💼", Other: "📍" };

export const RESTAURANTS = [
  { id: 1, name: "Paradise Biryani", color: "#C0392B", cuisine: "Hyderabadi Biryani", rating: 4.8, addr: "MG Road, Secunderabad", hrs: "11am–11pm", lat: 17.4399, lng: 78.4983 },
  { id: 2, name: "Chutneys", color: "#2A7040", cuisine: "South Indian Veg", rating: 4.6, addr: "Banjara Hills, Hyderabad", hrs: "7am–10pm", lat: 17.4126, lng: 78.4484 },
  { id: 3, name: "Bawarchi", color: "#E07A35", cuisine: "Hyderabadi & Mughlai", rating: 4.5, addr: "RTC Cross Roads", hrs: "11am–11pm", lat: 17.3962, lng: 78.4796 },
  { id: 4, name: "Eat Street", color: "#5050C0", cuisine: "Multi-Cuisine & Healthy", rating: 4.3, addr: "Necklace Road, Hyderabad", hrs: "6pm–11pm", lat: 17.4062, lng: 78.4691 },
  { id: 5, name: "Hotel Shadab", color: "#A03030", cuisine: "Haleem & Mughlai", rating: 4.7, addr: "High Court, Old City", hrs: "7am–11pm", lat: 17.3616, lng: 78.4747 },
  { id: 6, name: "Ohri's Dum Pukht", color: "#C07820", cuisine: "Mughlai & Healthy Bowl", rating: 4.4, addr: "Somajiguda, Hyderabad", hrs: "12pm–11pm", lat: 17.4239, lng: 78.4528 },
];
