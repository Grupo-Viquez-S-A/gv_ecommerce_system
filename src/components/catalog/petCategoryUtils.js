function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function isPetCategoryProduct(product) {
  const categoryName =
    product?.category?.category_name ||
    product?.categories?.category_name ||
    product?.category_name ||
    "";

  return normalizeText(categoryName) === "mascotas";
}

export function hasPetCategoryProducts(products = []) {
  return (Array.isArray(products) ? products : []).some(isPetCategoryProduct);
}
