export default function AgentMetricCard({
  label,
  value,
  icon,
  iconContainerClass,
  iconClass,
  growth,
  growthClass,
}) {
  return (
    <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4 hover:border-[#C9A227]/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconContainerClass} ${iconClass}`}
        >
          {icon}
        </div>

        {growth && (
          <span className={`text-xs font-medium ${growthClass}`}>
            {growth}
          </span>
        )}
      </div>

      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}