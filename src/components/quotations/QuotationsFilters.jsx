import { RiArrowDownSFill, RiCalendarLine, RiSearchLine } from "react-icons/ri";

export default function QuotationsFilters({ search, setSearch, statusFilter, setStatusFilter, companyFilter, setCompanyFilter, agentFilter, setAgentFilter, clientFilter, setClientFilter, dateFrom, setDateFrom, dateTo, setDateTo, clearFilters, error, ordersError, companyOptions, agentOptions, clientOptions }) {
  return <>
        {/* Filtros */}
        <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                Buscar
              </label>
              <div className="relative">
                <RiSearchLine
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="text"
                  placeholder="Buscar por número o cliente..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                Cliente
              </label>

              <div className="relative">
                <select
                  value={clientFilter}
                  onChange={(event) =>
                    setClientFilter(event.target.value)
                  }
                  className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer"
                >
                  {clientOptions.map((client) => (
                    <option key={client}>{client}</option>
                  ))}
                </select>

                <RiArrowDownSFill
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                Empresa
              </label>

              <div className="relative">
                <select
                  value={companyFilter}
                  onChange={(event) =>
                    setCompanyFilter(event.target.value)
                  }
                  className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer"
                >
                  {companyOptions.map((company) => (
                    <option key={company}>{company}</option>
                  ))}
                </select>

                <RiArrowDownSFill
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                Estado
              </label>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer"
                >
                  <option value="Todos">Todos los estados</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En revisión">En revisión</option>
                  <option value="Aprobada">Aprobada</option>
                  <option value="Rechazada">Rechazada</option>
                  <option value="Vencida">Vencida</option>
                  <option value="Convertida">Convertida</option>
                </select>

                <RiArrowDownSFill
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                Vendedor
              </label>

              <div className="relative">
                <select
                  value={agentFilter}
                  onChange={(event) =>
                    setAgentFilter(event.target.value)
                  }
                  className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer"
                >
                  {agentOptions.map((agent) => (
                    <option key={agent}>{agent}</option>
                  ))}
                </select>

                <RiArrowDownSFill
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                Fecha desde
              </label>

              <div className="relative">
                <RiCalendarLine
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                Fecha hasta
              </label>

              <div className="relative">
                <RiCalendarLine
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors"
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className="flex-1 bg-[#1c2538] border border-[#2a3550] text-gray-300 hover:text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>

              <button
                type="button"
                className="flex-1 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer"
              >
                Buscar
              </button>
            </div>
          </div>
        </div>

        {(error || ordersError) && (
          <div className="mb-6 rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error || ordersError}
          </div>
        )}
  </>;
}
