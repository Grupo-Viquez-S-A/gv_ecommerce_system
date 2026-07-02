import { PackageSearch, RotateCcw } from 'lucide-react';

export default function EmptyState({
  hasActiveFilters = false,
  onClearFilters,
}) {
  const title = hasActiveFilters
    ? 'No encontramos productos con esos filtros'
    : 'Aún no hay productos disponibles';

  const description = hasActiveFilters
    ? 'Intenta cambiar los filtros seleccionados o realiza una búsqueda diferente.'
    : 'Cuando existan productos publicados, aparecerán disponibles en este catálogo.';

  return (
    <section
      className="
        flex min-h-[340px] flex-col items-center justify-center
        rounded-2xl border border-dashed border-[#35547E]
        bg-[#102441]/60 px-6 py-12 text-center
      "
    >
      <div
        className="
          flex h-16 w-16 items-center justify-center rounded-2xl
          border border-[#35547E] bg-[#091A31]
        "
      >
        <PackageSearch className="h-8 w-8 text-[#D7A91D]" />
      </div>

      <h2 className="mt-5 text-xl font-extrabold text-white">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
        {description}
      </p>

      {hasActiveFilters && onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="
            mt-6 inline-flex items-center gap-2 rounded-xl
            border border-[#45648D] bg-[#132F58]
            px-4 py-2.5 text-sm font-bold text-white
            transition hover:border-[#D7A91D]
            hover:bg-[#1B3E6B] hover:text-[#E9BC2D]
            active:scale-[0.98]
          "
        >
          <RotateCcw className="h-4 w-4" />
          Limpiar filtros
        </button>
      )}
    </section>
  );
}