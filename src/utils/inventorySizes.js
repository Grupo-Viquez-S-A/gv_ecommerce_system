function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const GENERAL_SIZE_LABELS = new Map([
  ["s", "Pequeño (P)"],
  ["p", "Pequeño (P)"],
  ["pequeno", "Pequeño (P)"],
  ["m", "Mediano (M)"],
  ["mediano", "Mediano (M)"],
  ["l", "Grande (G)"],
  ["g", "Grande (G)"],
  ["grande", "Grande (G)"],
]);

export function getInventorySizeLabel(sizeName) {
  return GENERAL_SIZE_LABELS.get(normalizeText(sizeName)) || String(sizeName || "").trim();
}

export function getCartItemNameWithSize(productName, sizeName) {
  const rawSizeName = String(sizeName || "").trim();
  const normalizedSizeName = normalizeText(rawSizeName);

  if (!rawSizeName || normalizedSizeName === "unica") {
    return productName;
  }

  return `${productName} - ${getInventorySizeLabel(rawSizeName)}`;
}
