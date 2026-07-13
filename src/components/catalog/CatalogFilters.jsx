import {
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { EMPTY_CATALOG_FILTERS } from "./catalogFilterDefaults.js";

function SelectField({
  id,
  label,
  value,
  onChange,
  defaultLabel,
  options = [],
  getOptionValue,
  getOptionLabel,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#86A4CE]"
      >
        {label}
      </label>

      <select
        id={id}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="
          h-11 w-full cursor-pointer rounded-xl border border-[#29466F]
          bg-[#091A31] px-4 text-sm text-white outline-none transition
          focus:border-[#D7A91D] focus:ring-2 focus:ring-[#D7A91D]/20
        "
      >
        <option value="">{defaultLabel}</option>

        {options.map((option, index) => (
          <option
            key={getOptionValue(option) || index}
            value={getOptionValue(option)}
          >
            {getOptionLabel(option)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function CatalogFilters({
  catalogType = "fabrics",
  showCategoryFilter = true,
  filters = EMPTY_CATALOG_FILTERS,
  categories = [],
  productTypes = [],
  materials = [],
  colors = [],
  collections = [],
  sizes = [],
  onFiltersChange,
  onClearFilters,
}) {
  const isTextileProductsCatalog =
    catalogType === "textile_products";

  const hasActiveFilters = Boolean(
    filters.search?.trim() ||
      filters.categoryId ||
      filters.typeId ||
      filters.materialId ||
      filters.color ||
      filters.collectionId ||
      filters.sizeId,
  );

  const handleChange = (field, value) => {
    onFiltersChange?.({
      ...filters,
      [field]: value,
    });
  };

  const handleClearFilters = () => {
    if (onClearFilters) {
      onClearFilters();
      return;
    }

    onFiltersChange?.(EMPTY_CATALOG_FILTERS);
  };

  const searchPlaceholder = isTextileProductsCatalog
    ? "Nombre, SKU, tipo, colección o talla..."
    : "Nombre, SKU, tipo, material o color...";

  const gridColumnsClass =
    isTextileProductsCatalog && !showCategoryFilter
      ? "xl:grid-cols-5"
      : "xl:grid-cols-6";

  return (
    <section
      className="
        mb-7 rounded-2xl border border-[#29466F]
        bg-[#102441] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.14)]
        sm:p-6
      "
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[#D7A91D]" />

          <h2 className="text-base font-bold text-white">
            Buscar y filtrar catálogo
          </h2>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="
              inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2
              text-xs font-semibold text-[#D7A91D]
              transition hover:bg-[#1A365D] hover:text-[#E9BC2D]
            "
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpiar filtros
          </button>
        )}
      </div>

      <div
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${gridColumnsClass}`}
      >
        <div className="xl:col-span-2">
          <label
            htmlFor="catalog-search"
            className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#86A4CE]"
          >
            Buscar producto
          </label>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D7A91D]" />

            <input
              id="catalog-search"
              type="search"
              value={filters.search || ""}
              onChange={(event) =>
                handleChange("search", event.target.value)
              }
              placeholder={searchPlaceholder}
              className="
                h-11 w-full rounded-xl border border-[#29466F]
                bg-[#091A31] py-2 pl-11 pr-4 text-sm text-white
                outline-none transition placeholder:text-slate-500
                focus:border-[#D7A91D] focus:ring-2 focus:ring-[#D7A91D]/20
              "
            />
          </div>
        </div>

        {showCategoryFilter && (
          <SelectField
            id="catalog-category"
            label="Categoría"
            value={filters.categoryId}
            defaultLabel="Todas"
            options={categories}
            getOptionValue={(category) => category.category_id}
            getOptionLabel={(category) => category.category_name}
            onChange={(value) =>
              handleChange("categoryId", value)
            }
          />
        )}

        <SelectField
          id="catalog-product-type"
          label="Tipo de producto"
          value={filters.typeId}
          defaultLabel="Todos"
          options={productTypes}
          getOptionValue={(type) => type.type_id}
          getOptionLabel={(type) => type.product_type}
          onChange={(value) => handleChange("typeId", value)}
        />

        {isTextileProductsCatalog ? (
          <>
            <SelectField
              id="catalog-collection"
              label="Colección"
              value={filters.collectionId}
              defaultLabel="Todas"
              options={collections}
              getOptionValue={(collection) =>
                collection.collection_id
              }
              getOptionLabel={(collection) =>
                collection.collection_name
              }
              onChange={(value) =>
                handleChange("collectionId", value)
              }
            />

            <SelectField
              id="catalog-size"
              label="Talla o medida"
              value={filters.sizeId}
              defaultLabel="Todas"
              options={sizes}
              getOptionValue={(size) => size.size_id}
              getOptionLabel={(size) => size.size_name}
              onChange={(value) =>
                handleChange("sizeId", value)
              }
            />
          </>
        ) : (
          <>
            <SelectField
              id="catalog-material"
              label="Material"
              value={filters.materialId}
              defaultLabel="Todos"
              options={materials}
              getOptionValue={(material) =>
                material.material_id
              }
              getOptionLabel={(material) =>
                material.material_name
              }
              onChange={(value) =>
                handleChange("materialId", value)
              }
            />

            <SelectField
              id="catalog-color"
              label="Color"
              value={filters.color}
              defaultLabel="Todos"
              options={colors}
              getOptionValue={(color) => color.value}
              getOptionLabel={(color) => color.label}
              onChange={(value) =>
                handleChange("color", value)
              }
            />
          </>
        )}
      </div>
    </section>
  );
}
