import ClientActionButtons from "./ClientActionButtons";
import ClientStatusBadge from "./ClientStatusBadge";
import ClientsEmptyState from "./ClientsEmptyState";

export default function ClientMobileList({
  clients = [],
  onClearFilters,
  onOpenBranches,
  onOpenRepresentatives,
  onView,
  onEdit,
  onDeactivate,
  emptyTitle,
  emptyDescription,
}) {
  return (
    <div className="md:hidden space-y-3 mb-6">
      {clients.length > 0 ? (
        clients.map((client) => (
          <div
            key={client.id}
            className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: client.color }}
                >
                  {client.initials}
                </div>

                <div className="min-w-0">
                  <div className="font-medium text-white text-sm truncate">
                    {client.name}
                  </div>

                  <div className="text-xs text-gray-500 truncate">
                    {client.company}
                  </div>
                </div>
              </div>

              <ClientStatusBadge status={client.status} compact />
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-white font-semibold">{client.sales}</span>

              <span className="text-gray-500 text-xs text-right">
                {client.lastPurchase}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-[#2a3550]">
              <ClientActionButtons
                client={client}
                compact
                onOpenBranches={onOpenBranches}
                onOpenRepresentatives={onOpenRepresentatives}
                onView={onView}
                onEdit={onEdit}
                onDeactivate={onDeactivate}
              />
            </div>
          </div>
        ))
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
