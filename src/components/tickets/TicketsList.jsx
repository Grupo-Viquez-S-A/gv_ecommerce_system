import { RiSearchLine, RiTicket2Line } from "react-icons/ri";

import TicketCard from "./TicketCard.jsx";

export default function TicketsList({ tickets, search, statusFilter, isLoading, onSearchChange, onStatusChange }) {
  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Mis solicitudes</h2>
          <p className="mt-1 text-xs text-gray-400">Consulta las solicitudes guardadas en el sistema.</p>
        </div>
        <span className="text-xs text-gray-500">{tickets.length} resultado{tickets.length === 1 ? "" : "s"}</span>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_170px]">
        <label className="relative block">
          <span className="sr-only">Buscar solicitudes</span>
          <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={17} />
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} className="w-full rounded-lg border border-[#33405d] bg-[#141d2e] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#C9A227]" placeholder="Buscar por código o asunto" />
        </label>
        <label>
          <span className="sr-only">Filtrar por estado</span>
          <select value={statusFilter} onChange={(event) => onStatusChange(event.target.value)} className="w-full rounded-lg border border-[#33405d] bg-[#141d2e] px-3 py-2.5 text-sm text-white outline-none focus:border-[#C9A227]">
            <option value="all">Todos los estados</option>
            <option value="new">Nuevos</option>
            <option value="assigned">Asignados</option>
            <option value="in_progress">En proceso</option>
            <option value="pending_user">Pendientes del solicitante</option>
            <option value="resolved">Resueltos</option>
            <option value="closed">Cerrados</option>
            <option value="reopened">Reabiertos</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-[#33405d] bg-[#141d2e]/60 text-sm text-gray-400">
          Cargando solicitudes...
        </div>
      ) : tickets.length > 0 ? (
        <div className="space-y-3">{tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)}</div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#33405d] bg-[#141d2e]/60 p-8 text-center">
          <div className="rounded-full bg-[#202c43] p-3 text-[#C9A227]"><RiTicket2Line size={25} /></div>
          <h3 className="mt-3 font-semibold text-white">No hay solicitudes para mostrar</h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500">Crea un ticket con el formulario o cambia los filtros de búsqueda.</p>
        </div>
      )}
    </section>
  );
}
