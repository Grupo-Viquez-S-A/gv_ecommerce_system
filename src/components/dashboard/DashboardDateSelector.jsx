import {
  RiArrowDownSFill,
  RiCalendarCheckFill,
} from "react-icons/ri";

export default function DashboardDateSelector({
  label = "1 - 30 de junio, 2024",
  onClick,
}) {
  return (
    <div className="flex items-center justify-end mb-4">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 text-sm text-gray-400 bg-[#1c2538] border border-[#2a3550] rounded-lg px-3 py-2 hover:text-white hover:border-[#C9A227]/50 transition-colors cursor-pointer"
      >
        <RiCalendarCheckFill size={14} />

        <span>{label}</span>

        <RiArrowDownSFill size={14} />
      </button>
    </div>
  );
}