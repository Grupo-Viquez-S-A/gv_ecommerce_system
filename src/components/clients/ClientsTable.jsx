import ClientActionButtons from "./ClientActionButtons";
import ClientStatusBadge from "./ClientStatusBadge";
import ClientsEmptyState from "./ClientsEmptyState";
import ClientsPagination from "./ClientsPagination";

export default function ClientsTable({
  clients = [],
  totalClients = 0,
  currentPage = 1,
  totalPages = 1,
  startItem = 0,
  endItem = 0,
  onPageChange,
  onClearFilters,
  onOpenBranches,
  onOpenRepresentatives,
  onView,
  onEdit,
  onDeactivate,
  onDelete,
  emptyTitle,
  emptyDescription,
}) {
  const columns = [
    "CLIENTE",
    "EMPRESA",
    "VENTAS ACUMULADAS",
    "ÚLTIMA COMPRA",
    "ESTADO",
    "ACCIONES",
  ];

  return (
    <div className="hidden md:block bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden mb-6">
      {clients.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a3550]">
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-3"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => onView(client)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onView(client);
                      }
                    }}
                    tabIndex={0}
                    aria-label={`Ver detalle de ${client.name}`}
                    className="cursor-pointer border-b border-[#2a3550] transition-colors last:border-0 hover:bg-[#1c2538] focus:bg-[#1c2538] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C9A227]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: client.color }}
                        >
                          {client.initials}
                        </div>

                        <span className="font-medium text-white">
                          {client.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3 text-gray-300 text-sm">
                      {client.company}
                    </td>

                    <td className="px-5 py-3 text-white font-semibold text-sm">
                      {client.sales}
                    </td>

                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {client.lastPurchase}
                    </td>

                    <td className="px-5 py-3">
                      <ClientStatusBadge status={client.status} />
                    </td>

                    <td className="px-5 py-3">
                      <ClientActionButtons
                        client={client}
                        onOpenBranches={onOpenBranches}
                        onOpenRepresentatives={onOpenRepresentatives}
                        onView={onView}
                        onEdit={onEdit}
                        onDeactivate={onDeactivate}
                        onDelete={onDelete}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ClientsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalClients}
            startItem={startItem}
            endItem={endItem}
            onPageChange={onPageChange}
          />
        </>
      ) : (
        <ClientsEmptyState
          onClearFilters={onClearFilters}
          title={emptyTitle}
          description={emptyDescription}
        />
      )}
    </div>
  );
}
