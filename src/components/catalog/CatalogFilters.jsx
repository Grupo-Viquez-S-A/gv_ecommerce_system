import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';

export const EMPTY_CATALOG_FILTERS = {
  search: '',
  categoryId: '',
  typeId: '',
  materialId: '',
  color: '',
};

export default function CatalogFilters({
  filters = EMPTY_CATALOG_FILTERS,
  categories = [],
  productTypes = [],
  materials = [],
  colors = [],
  onFiltersChange,
  onClearFilters,
}) {
  const hasActiveFilters = Boolean(
    filters.search?.trim() ||
      filters.categoryId ||
      filters.typeId ||
      filters.materialId ||
      filters.color
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {/* Buscador */}
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
              value={filters.search || ''}
              onChange={(event) =>
                handleChange('search', event.target.value)
              }
              placeholder="Nombre, SKU, tipo, material o color..."
              className="
                h-11 w-full rounded-xl border border-[#29466F]
                bg-[#091A31] py-2 pl-11 pr-4 text-sm text-white
                outline-none transition placeholder:text-slate-500
                focus:border-[#D7A91D] focus:ring-2 focus:ring-[#D7A91D]/20
              "
            />
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label
            htmlFor="catalog-category"
            className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#86A4CE]"
          >
            Categoría
          </label>

          <select
            id="catalog-category"
            value={filters.categoryId || ''}
            onChange={(event) =>
              handleChange('categoryId', event.target.value)
            }
            className="
              h-11 w-full cursor-pointer rounded-xl border border-[#29466F]
              bg-[#091A31] px-4 text-sm text-white outline-none transition
              focus:border-[#D7A91D] focus:ring-2 focus:ring-[#D7A91D]/20
            "
          >
            <option value="">Todas</option>

            {categories.map((category) => (
              <option
                key={category.category_id}
                value={category.category_id}
              >
                {category.category_name}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de producto */}
        <div>
          <label
            htmlFor="catalog-product-type"
            className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#86A4CE]"
          >
            Tipo de producto
          </label>

          <select
            id="catalog-product-type"
            value={filters.typeId || ''}
            onChange={(event) =>
              handleChange('typeId', event.target.value)
            }
            className="
              h-11 w-full cursor-pointer rounded-xl border border-[#29466F]
              bg-[#091A31] px-4 text-sm text-white outline-none transition
              focus:border-[#D7A91D] focus:ring-2 focus:ring-[#D7A91D]/20
            "
          >
            <option value="">Todos</option>

            {productTypes.map((productType) => (
              <option
                key={productType.type_id}
                value={productType.type_id}
              >
                {productType.product_type}
              </option>
            ))}
          </select>
        </div>

        {/* Material */}
        <div>
          <label
            htmlFor="catalog-material"
            className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#86A4CE]"
          >
            Material
          </label>

          <select
            id="catalog-material"
            value={filters.materialId || ''}
            onChange={(event) =>
              handleChange('materialId', event.target.value)
            }
            className="
              h-11 w-full cursor-pointer rounded-xl border border-[#29466F]
              bg-[#091A31] px-4 text-sm text-white outline-none transition
              focus:border-[#D7A91D] focus:ring-2 focus:ring-[#D7A91D]/20
            "
          >
            <option value="">Todos</option>

            {materials.map((material) => (
              <option
                key={material.material_id}
                value={material.material_id}
              >
                {material.material_name}
              </option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div>
          <label
            htmlFor="catalog-color"
            className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#86A4CE]"
          >
            Color
          </label>

          <select
            id="catalog-color"
            value={filters.color || ''}
            onChange={(event) =>
              handleChange('color', event.target.value)
            }
            className="
              h-11 w-full cursor-pointer rounded-xl border border-[#29466F]
              bg-[#091A31] px-4 text-sm text-white outline-none transition
              focus:border-[#D7A91D] focus:ring-2 focus:ring-[#D7A91D]/20
            "
          >
            <option value="">Todos</option>

            {colors.map((color) => (
              <option key={color.value} value={color.value}>
                {color.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}