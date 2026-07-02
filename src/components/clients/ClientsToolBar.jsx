import {
  RiArrowDownSFill,
  RiFilterLine,
  RiSearchLine,
} from "react-icons/ri";

export default function ClientsToolbar({
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onOpenAdvancedFilters,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1">
        <RiSearchLine
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />

        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors"
        />
      </div>

      <div className="relative">
        <RiFilterLine
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />

        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
          className="bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-8 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer min-w-[160px]"
        >
          <option value="Todos">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>

        <RiArrowDownSFill
          size={15}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
      </div>

      <button
        type="button"
        onClick={onOpenAdvancedFilters}
        className="flex items-center gap-2 bg-[#141d2e] hover:bg-[#C9A227]/15 border border-[#2a3550] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
      >
        <RiFilterLine size={15} />
        Filtros
      </button>
    </div>
  );
}