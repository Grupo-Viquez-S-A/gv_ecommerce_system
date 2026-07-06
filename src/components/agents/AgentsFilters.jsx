import {
  RiArrowDownSFill,
  RiFilterLine,
  RiSearchLine,
} from "react-icons/ri";

import {
  AGENT_COMPANIES,
  AGENT_STATUSES,
} from "../../constants/agents.constants.js";

export default function AgentsFilters({
  search,
  statusFilter,
  companyFilter,
  onSearchChange,
  onStatusFilterChange,
  onCompanyFilterChange,
  onAdvancedFiltersClick,
}) {
  return (
    <section className="flex flex-col sm:flex-row gap-3 mb-5">
      {/* Buscador */}
      <div className="relative flex-1">
        <RiSearchLine
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />

        <input
          type="text"
          placeholder="Buscar agente..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full bg-[#141d2e] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Filtro por estado */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
            className="appearance-none bg-[#141d2e] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer"
          >
            <option value="Todos">Todos los estados</option>

            {AGENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <RiArrowDownSFill
            size={16}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
        </div>

        {/* Filtro por empresa */}
        <div className="relative">
          <select
            value={companyFilter}
            onChange={(event) => onCompanyFilterChange(event.target.value)}
            className="appearance-none bg-[#141d2e] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer"
          >
            {AGENT_COMPANIES.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>

          <RiArrowDownSFill
            size={16}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
        </div>

        {/* Reservado para filtros avanzados futuros */}
        <button
          type="button"
          onClick={onAdvancedFiltersClick}
          className="flex items-center gap-1.5 bg-[#141d2e] border border-[#2a3550] text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm transition-colors"
        >
          <RiFilterLine size={14} />
          Filtros
        </button>
      </div>
    </section>
  );
}