function normalizeCategoryName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getItemCategoryName(item) {
  return (
    item?.categoryName ||
    item?.category_name ||
    item?.category?.category_name ||
    ""
  );
}

export function getQuotationAdvancePercentageForItems(items = []) {
  const normalizedCategories = items
    .map((item) => normalizeCategoryName(getItemCategoryName(item)))
    .filter(Boolean);

  if (normalizedCategories.some((category) => category === "uniformes")) {
    return 50;
  }

  if (
    normalizedCategories.length > 0 &&
    normalizedCategories.every((category) => category === "mascotas")
  ) {
    return 0;
  }

  return 0;
}

export function getQuotationAdvanceRuleLabel(items = []) {
  const percentage = getQuotationAdvancePercentageForItems(items);

  if (percentage <= 0) {
    return "Sin adelanto requerido";
  }

  return `Adelanto requerido (${percentage}%)`;
}
