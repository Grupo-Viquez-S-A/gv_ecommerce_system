export default function OperationalMetrics({ metrics, showGrowth = false }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-xl border border-[#2a3550] bg-[#141d2e] p-4 transition-colors hover:border-[#C9A227]/20">
          <div className="mb-3 flex items-center justify-between">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${metric.bg} ${metric.iconColor}`}>
              <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: metric.color }} />
            </div>
          </div>
          <div className="text-xl font-bold text-white">{metric.value}</div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">{metric.label}</div>
          {showGrowth && (
            <div className={`mt-1 text-xs font-medium ${metric.growthColor}`}>
              {metric.growth} vs. mes anterior
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
