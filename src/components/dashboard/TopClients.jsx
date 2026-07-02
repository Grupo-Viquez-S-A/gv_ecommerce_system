import { RiArrowDownSFill, RiArrowRightSLine } from "react-icons/ri";

export default function TopClients({
  clients = [],
  periodLabel = "Este mes",
  onPeriodClick,
  onViewAll,
}) {
  return (
    <section className="bg-[#1c2538] border border-[#2a3550] rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-white">
          Top 5 Clientes por Ventas
        </h3>

        <button
          type="button"
          onClick={onPeriodClick}
          className="text-xs text-[#C9A227] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
        >
          {periodLabel}
          <RiArrowDownSFill size={12} />
        </button>
      </div>

      {clients.length > 0 ? (
        <div className="space-y-3">
          {clients.map((client, index) => {
            const rank = client.rank || index + 1;
            const isFirstPlace = rank === 1;

            return (
              <div
                key={client.id || `${client.name}-${index}`}
                className="flex items-center justify-between gap-4 py-2 border-b border-[#2a3550] last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isFirstPlace
                        ? "bg-[#c9a227] text-[#0B1120]"
                        : "bg-[#C9A227]/15 text-white"
                    }`}
                  >
                    {rank}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm text-white font-medium truncate">
                      {client.name}
                    </div>

                    <div className="text-xs text-gray-500 truncate">
                      {client.company}
                    </div>
                  </div>
                </div>

                <span className="text-sm font-bold text-white whitespace-nowrap">
                  {client.amount}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-10 text-center">
          <p className="text-sm text-gray-500">
            No hay clientes con ventas registradas.
          </p>
        </div>
      )}

      {onViewAll && (
        <div className="mt-3 pt-3 border-t border-[#2a3550] flex justify-end">
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs text-[#C9A227] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            Ver todos los clientes
            <RiArrowRightSLine size={12} />
          </button>
        </div>
      )}
    </section>
  );
}