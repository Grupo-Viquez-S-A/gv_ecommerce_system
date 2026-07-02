import { RiUserFill } from "react-icons/ri";

export default function ClientsEmptyState({
  onClearFilters,
  title = "No se encontraron clientes",
  description = "Prueba ajustando la búsqueda o los filtros aplicados.",
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
      <div className="w-14 h-14 rounded-full bg-[#2a3550] flex items-center justify-center text-gray-600">
        <RiUserFill size={28} />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-400">{title}</p>
        {description && (
          <p className="text-xs text-gray-600 mt-1 max-w-xs">{description}</p>
        )}
      </div>

      {onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="text-xs text-[#C9A227] hover:text-white hover:underline transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}