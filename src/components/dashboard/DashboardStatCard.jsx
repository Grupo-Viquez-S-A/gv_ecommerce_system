import { RiArrowUpLine } from "react-icons/ri";

export default function DashboardStatCard({
  icon,
  label,
  value,
  growth,
  colorClass,
}) {
  return (
    <div className="bg-[#1c2538] border border-[#2a3550] rounded-xl p-5 flex-1 min-w-[200px]">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${colorClass}`}
        >
          {icon}
        </div>
      </div>

      <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
        {label}
      </div>

      <div className="text-white text-2xl font-bold mb-1">
        {value}
      </div>

      {growth && (
        <div className="flex items-center gap-1 text-xs">
          <span className="text-green-400 flex items-center gap-0.5">
            <RiArrowUpLine size={12} />
            {growth}
          </span>

          <span className="text-gray-500">vs. mes anterior</span>
        </div>
      )}
    </div>
  );
}