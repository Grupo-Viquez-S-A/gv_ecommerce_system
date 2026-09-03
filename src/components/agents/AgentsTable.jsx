import { RiUserFill } from "react-icons/ri";

import EmptyState from "./EmptyState.jsx";
import Pagination from "./Pagination.jsx";
import AgentTableRow from "./AgentTableRow.jsx";

export default function AgentsTable({
  agents = [],
  totalAgents = 0,
  currentPage = 1,
  totalPages = 1,
  startItem = 1,
  endItem = agents.length,
  onPageChange,
  onView,
  onEdit,
  onDeactivate,
  onDelete,
  onClearFilters,
}) {
  const hasAgents = agents.length > 0;

  return (
    <section className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden">
      <table className="w-full text-left hidden md:table">
        <thead>
          <tr className="border-b border-[#2a3550]">
            <th className="px-5 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Agente
            </th>
            <th className="px-5 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Empresa
            </th>
            <th className="px-5 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Clientes
            </th>
            <th className="px-5 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Ventas último mes
            </th>
            <th className="px-5 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-5 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#2a3550]">
          {agents.map((agent) => (
            <AgentTableRow
              key={agent.id}
              agent={agent}
              onView={onView}
              onEdit={onEdit}
              onDeactivate={onDeactivate}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>

      {!hasAgents && (
        <EmptyState
          icon={<RiUserFill size={28} />}
          title="No se encontraron agentes"
          actionLabel="Limpiar filtros"
          onAction={onClearFilters}
        />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        startItem={hasAgents ? startItem : 0}
        endItem={hasAgents ? endItem : 0}
        totalItems={totalAgents}
        onPageChange={onPageChange}
      />
    </section>
  );
}
