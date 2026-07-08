export default function ClientSummaryCard({ icon, label, value, helper, tone = "gold" }) {
  const toneClasses = {
    gold: "bg-[#C9A227]/20 text-[#F1C94B] border-[#C9A227]/30",
    blue: "bg-blue-500/15 text-blue-300 border-blue-500/25",
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    red: "bg-red-500/15 text-red-300 border-red-500/25",
    purple: "bg-violet-500/15 text-violet-300 border-violet-500/25",
  };

  return (
    <div className="rounded-lg border border-[#2a3550] bg-[#1b2538] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg border ${toneClasses[tone] || toneClasses.gold}`}
        >
          {icon}
        </div>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}
