import {
  RiArrowDownSFill,
  RiArrowRightSLine,
} from "react-icons/ri";

export default function AdvisorRanking({
  advisors = [],
  periodLabel = "Este mes",
  onPeriodClick,
  onViewRanking,
}) {
  return (
    <section className="bg-[#1c2538] border border-[#2a3550] rounded-xl p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-white">
          Rendimiento por Asesor (Ventas del mes)
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

      {advisors.length > 0 ? (
        <div className="space-y-3">
          {advisors.map((advisor, index) => {
            const percentage = Number(advisor.percentage) || 0;
            const progressWidth = Math.max(0, Math.min(percentage, 100));
            const isGoalMet = percentage >= 100;

            return (
              <div key={advisor.id || `${advisor.name}-${index}`}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        index < 3
                          ? "bg-[#c9a227] text-[#0B1120]"
                          : "bg-[#C9A227]/15 text-white"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm text-white font-medium truncate">
                        {advisor.name}
                      </div>

                      <div className="text-xs text-gray-500 truncate">
                        {advisor.role} · {advisor.company}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-medium text-white">
                      {advisor.amount}
                    </div>

                    <div
                      className={`text-xs font-medium ${
                        isGoalMet ? "text-green-400" : "text-yellow-400"
                      }`}
                    >
                      {percentage}%
                    </div>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-[#C9A227]/15 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isGoalMet ? "bg-green-400" : "bg-[#c9a227]"
                    }`}
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-10 text-center">
          <p className="text-sm text-gray-500">
            No hay datos de asesores disponibles.
          </p>
        </div>
      )}

      {onViewRanking && (
        <div className="mt-3 pt-3 border-t border-[#2a3550] flex justify-end">
          <button
            type="button"
            onClick={onViewRanking}
            className="text-xs text-[#C9A227] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            Ver ranking completo
            <RiArrowRightSLine size={12} />
          </button>
        </div>
      )}
    </section>
  );
}
