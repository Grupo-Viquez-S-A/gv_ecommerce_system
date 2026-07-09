import { RiArrowRightSLine } from "react-icons/ri";

export default function CompanyPerformance({
  performance = [],
  onViewReport,
  isLoading = false,
  error = null,
}) {
  return (
    <section className="bg-[#1c2538] border border-[#2a3550] rounded-xl p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-white">
          Rendimiento por Empresa (Acumulado del mes)
        </h3>
      </div>

      {error ? (
        <div className="py-10 text-center">
          <p className="text-sm text-red-400">
            No fue posible cargar el rendimiento: {error}
          </p>
        </div>
      ) : isLoading ? (
        <div className="py-10 text-center">
          <p className="text-sm text-gray-500">Cargando rendimiento...</p>
        </div>
      ) : performance.length > 0 ? (
        <div className="space-y-3">
          {performance.map((item, index) => {
            const safePercentage = Math.max(
              0,
              Math.min(Number(item.percentage) || 0, 100),
            );

            return (
              <div key={item.id || item.name || index}>
                <div className="flex items-center justify-between gap-3 text-xs mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-7 h-7 rounded bg-[#C9A227]/15 flex items-center justify-center text-xs flex-shrink-0"
                      style={{ color: item.color || "#C9A227" }}
                    >
                      {index + 1}
                    </div>

                    <span className="text-gray-300 truncate">
                      {item.name}
                    </span>
                  </div>

                  <span className="text-white font-medium whitespace-nowrap">
                    {item.amount}
                  </span>
                </div>

                <div className="w-full h-2 bg-[#C9A227]/15 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${safePercentage}%`,
                      backgroundColor: item.color || "#C9A227",
                    }}
                  />
                </div>

                <div className="text-right text-xs text-gray-500 mt-0.5">
                  {item.percentage}%
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-10 text-center">
          <p className="text-sm text-gray-500">
            No hay datos de rendimiento disponibles.
          </p>
        </div>
      )}

      {onViewReport && (
        <div className="mt-3 pt-3 border-t border-[#2a3550] flex justify-end">
          <button
            type="button"
            onClick={onViewReport}
            className="text-xs text-[#C9A227] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            Ver reporte completo
            <RiArrowRightSLine size={12} />
          </button>
        </div>
      )}
    </section>
  );
}