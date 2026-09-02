import {
  Grid2X2,
  Package,
  PawPrint,
  Shirt,
} from "lucide-react";

function getCategoryIcon(categoryName) {
  const normalizedName = String(categoryName || "")
    .trim()
    .toLowerCase();

  if (
    normalizedName.includes("mascota") ||
    normalizedName.includes("animal") ||
    normalizedName.includes("pet")
  ) {
    return PawPrint;
  }

  if (
    normalizedName.includes("uniforme") ||
    normalizedName.includes("prenda") ||
    normalizedName.includes("ropa") ||
    normalizedName.includes("vestimenta")
  ) {
    return Shirt;
  }

  return Package;
}

function CategoryCard({
  icon: Icon,
  title,
  count,
  isActive,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
        isActive
          ? "border-[#D7A91D] bg-[#D7A91D]/10 shadow-[0_8px_20px_rgba(215,169,29,0.12)]"
          : "border-[#29466F] bg-[#102441] hover:border-[#4B6B96] hover:bg-[#132F58]"
      }`}
    >
      <div
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
          isActive
            ? "bg-[#D7A91D] text-[#071426]"
            : "bg-[#091A31] text-[#D7A91D]"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-extrabold ${
            isActive ? "text-white" : "text-[#C9D8EC]"
          }`}
        >
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {count} {count === 1 ? "producto" : "productos"}
        </p>
      </div>
    </button>
  );
}

export default function ProductCategorySwitcher({
  categories = [],
  activeCategoryId = "",
  totalProducts = 0,
  onChange,
}) {
  const validCategories = Array.isArray(categories)
    ? categories.filter(
        (category) =>
          category?.category_id && category?.category_name,
      )
    : [];

  if (validCategories.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CategoryCard
          icon={Grid2X2}
          title="Todos los productos"
          count={totalProducts}
          isActive={!activeCategoryId}
          onClick={() => onChange?.("")}
        />

        {validCategories.map((category) => {
          const Icon = getCategoryIcon(category.category_name);

          return (
            <CategoryCard
              key={category.category_id}
              icon={Icon}
              title={category.category_name}
              count={category.product_count || 0}
              isActive={
                activeCategoryId === category.category_id
              }
              onClick={() =>
                onChange?.(category.category_id)
              }
            />
          );
        })}
      </div>
    </section>
  );
}
