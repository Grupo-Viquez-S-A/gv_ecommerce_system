import { Info } from "lucide-react";

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

export default function PetCostumeNotice() {
  return (
    <aside className="mb-4 flex gap-3 rounded-xl border border-[#D7A91D]/35 bg-[#D7A91D]/10 p-4 text-sm text-slate-200">
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#E9BC2D]" aria-hidden="true" />

      <p className="leading-6">
        <span className="font-bold text-white">Importante:</span> los disfraces para mascotas incluyen únicamente el disfraz. Los accesorios mostrados en las imágenes son ilustrativos y no están incluidos.
      </p>
    </aside>
  );
}
