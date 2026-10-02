export const steps = [
  "Idea",
  "Customer",
  "Product",
  "Value",
  "Name",
  "Brand",
  "Price",
  "First customer",
  "Launch",
];
export const palettes = [
  { name: "Blue sky", colors: ["#4338ca", "#eef2ff", "#fbbf24"] },
  { name: "Berry bright", colors: ["#9d174d", "#fff1f2", "#fb923c"] },
  { name: "Fresh mint", colors: ["#065f46", "#ecfdf5", "#a3e635"] },
  { name: "Cosmic", colors: ["#6d28d9", "#f5f3ff", "#38bdf8"] },
];
export const styles = [
  "Fun & Colorful",
  "Clean & Modern",
  "Cute",
  "Sporty",
  "Fancy",
  "Bold",
];
export function emptyBusiness() {
  return {
    originalIdea: "",
    customer: "",
    product: "",
    valueProposition: "",
    name: "",
    brand: { style: "", colors: [], imagery: "", description: "" },
    logoImage: "",
    logoAccepted: false,
    logoSkipped: false,
    price: "",
    priceReasoning: "",
    firstCustomer: "",
    marketingIdea: "",
    launchPlan: [],
    website: null,
  };
}
export function cleanText(value, max = 500) {
  return typeof value === "string"
    ? value
        .replace(/[\u0000-\u001f]/g, " ")
        .trim()
        .slice(0, max)
    : "";
}
export function sanitizeBusiness(value) {
  const b = emptyBusiness();
  if (!value || typeof value !== "object") return b;
  for (const key of [
    "originalIdea",
    "customer",
    "product",
    "valueProposition",
    "name",
    "price",
    "priceReasoning",
    "firstCustomer",
    "marketingIdea",
  ])
    b[key] = cleanText(value[key]);
  b.brand = {
    style: cleanText(value.brand?.style, 80),
    colors: Array.isArray(value.brand?.colors)
      ? value.brand.colors.filter((c) => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 3)
      : [],
    imagery: cleanText(value.brand?.imagery),
    description: cleanText(value.brand?.description),
  };
  b.launchPlan = Array.isArray(value.launchPlan)
    ? value.launchPlan
        .map((x) => cleanText(x, 240))
        .filter(Boolean)
        .slice(0, 6)
    : [];
  return b;
}
export function sanitizeWebsite(value) {
  if (!value || typeof value !== "object")
    throw new Error("The website design was incomplete. Please try again.");
  const out = {};
  for (const key of [
    "headline",
    "subheadline",
    "cta",
    "about",
    "productName",
    "productDescription",
    "price",
  ]) {
    out[key] = cleanText(value[key], key === "headline" ? 120 : 600);
    if (!out[key])
      throw new Error("The website copy was incomplete. Please try again.");
  }
  const theme = value.theme || {};
  out.theme = {
    style: ["playful", "modern", "bold"].includes(theme.style)
      ? theme.style
      : "modern",
    primaryColor: /^#[0-9a-f]{6}$/i.test(theme.primaryColor)
      ? theme.primaryColor
      : "#4338ca",
    secondaryColor: /^#[0-9a-f]{6}$/i.test(theme.secondaryColor)
      ? theme.secondaryColor
      : "#eef2ff",
    accentColor: /^#[0-9a-f]{6}$/i.test(theme.accentColor)
      ? theme.accentColor
      : "#fbbf24",
    logoSize: ["normal", "large"].includes(theme.logoSize)
      ? theme.logoSize
      : "normal",
  };
  out.sections = Array.isArray(value.sections)
    ? value.sections
        .slice(0, 3)
        .map((s) => ({
          title: cleanText(s?.title, 100),
          text: cleanText(s?.text, 400),
        }))
        .filter((s) => s.title && s.text)
    : [];
  return out;
}
export function contrast(color) {
  const h = color.replace("#", "");
  const rgb = [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 > 0.179
    ? "#172033"
    : "#ffffff";
}
