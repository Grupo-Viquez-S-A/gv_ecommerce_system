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

export function shouldProductUseDimensions(product) {
  const categoryName =
    product?.category?.category_name ||
    product?.categories?.category_name ||
    product?.category_name ||
    "";
  const typeName =
    product?.product_type?.product_type ||
    product?.type?.product_type ||
    product?.type_name ||
    product?.product_type_name ||
    "";

  if (!categoryName || !typeName) {
    return true;
  }

  return normalizeText(categoryName) !== "mascotas" || normalizeText(typeName) === "camas";
}
