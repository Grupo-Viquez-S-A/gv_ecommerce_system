import { REPORT_KPIS } from "./reportsViewData.jsx";

export default function ReportsKpis() {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {REPORT_KPIS.map((kpi) => {
        const Icon = kpi.icon;
        return <div key={kpi.label} className="rounded-xl border border-[#2a3550] bg-[#141d2e] p-4">
          <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${kpi.bg}`}><Icon size={16} style={{ color: kpi.color }} /></div>
          <div className="text-2xl font-bold">{kpi.value}</div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{kpi.label}</div>
          <div className="mt-1.5 text-xs text-green-400">{kpi.change}</div>
        </div>;
      })}
    </div>
  );
}
