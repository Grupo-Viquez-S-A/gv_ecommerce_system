export default function ClientMetrics({ metrics = [] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
      {metrics.map((metric, index) => (
        <div
          key={metric.label || index}
          className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4 hover:border-[#C9A227]/40 transition-colors"
        >
          <div
            className={`w-8 h-8 rounded-lg ${metric.color} flex items-center justify-center ${metric.iconColor} mb-2`}
          >
            {metric.icon}
          </div>

          <div className="text-xs text-gray-500 font-medium mb-0.5 leading-tight">
            {metric.label}
          </div>

          <div className="text-2xl font-bold text-white">
            {metric.value}
          </div>

          {metric.growth && (
            <div className="flex items-center gap-1 text-xs mt-0.5">
              <span className={`font-medium ${metric.growthColor}`}>
                {metric.growth}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}