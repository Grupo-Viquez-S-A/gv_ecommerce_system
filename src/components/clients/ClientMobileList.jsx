import ClientActionButtons from "./ClientActionButtons";
import ClientStatusBadge from "./ClientStatusBadge";
import ClientsEmptyState from "./ClientsEmptyState";

export default function ClientMobileList({
  clients = [],
  onClearFilters,
  onView,
  onEdit,
  onDeactivate,
  onDelete,
  emptyTitle,
  emptyDescription,
}) {
  return (
    <div className="md:hidden space-y-3 mb-6">
      {clients.length > 0 ? (
        clients.map((client) => (
          <div
            key={client.id}
            onClick={() => onView(client)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onView(client);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Ver detalle de ${client.name}`}
            className="cursor-pointer rounded-xl border border-[#2a3550] bg-[#141d2e] p-4 transition-colors hover:border-[#C9A227]/45 hover:bg-[#1c2538] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
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
                onView={onView}
                onEdit={onEdit}
                onDeactivate={onDeactivate}
                onDelete={onDelete}
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
