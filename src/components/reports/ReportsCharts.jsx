import { RiArrowDownSFill } from "react-icons/ri";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { REPORT_CATEGORY_DATA, REPORT_COMPANY_DATA, REPORT_TREND_DATA, ReportsTooltip } from "./reportsViewData.jsx";

const chartTooltipStyle = { backgroundColor: "#141d2e", border: "1px solid #2a3550", borderRadius: "8px", fontSize: "12px" };
function ChartHeader({ children }) { return <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold">{children}</h3><button type="button" className="flex cursor-pointer items-center gap-1 rounded-lg bg-[#1c2538] px-2 py-1 text-xs text-gray-400 transition-colors hover:text-white">Este mes <RiArrowDownSFill size={12} /></button></div>; }

export default function ReportsCharts() {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-[#2a3550] bg-[#141d2e] p-4">
        <ChartHeader>Tendencia de ventas</ChartHeader>
        <div className="h-48"><ResponsiveContainer width="100%" height="100%"><AreaChart data={REPORT_TREND_DATA} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}><defs><linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C9A227" stopOpacity={0.3} /><stop offset="95%" stopColor="#C9A227" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#2a3550" vertical={false} /><XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip content={<ReportsTooltip />} /><Area type="monotone" dataKey="value" stroke="#C9A227" strokeWidth={2} fill="url(#colorTrend)" /></AreaChart></ResponsiveContainer></div>
      </div>
      <div className="rounded-xl border border-[#2a3550] bg-[#141d2e] p-4">
        <ChartHeader>Ventas por empresa</ChartHeader>
        <div className="h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={REPORT_COMPANY_DATA} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#2a3550" horizontal={false} /><XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} width={100} /><Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: "#fff" }} /><Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>{REPORT_COMPANY_DATA.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Bar></BarChart></ResponsiveContainer></div>
      </div>
      <div className="rounded-xl border border-[#2a3550] bg-[#141d2e] p-4">
        <ChartHeader>Ventas por categoría</ChartHeader>
        <div className="flex items-center gap-4"><div className="h-40 w-40 flex-shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={REPORT_CATEGORY_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value" stroke="none">{REPORT_CATEGORY_DATA.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: "#fff" }} /></PieChart></ResponsiveContainer></div><div className="flex-1 space-y-2">{REPORT_CATEGORY_DATA.map((category) => <div key={category.name} className="flex items-center gap-2"><div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: category.color }} /><span className="flex-1 truncate text-xs text-gray-300">{category.name}</span><span className="text-xs font-semibold text-white">₡{category.value} M</span><span className="w-8 text-right text-xs text-gray-500">{Math.round((category.value / 185) * 100)}%</span></div>)}</div></div>
      </div>
    </div>
  );
}
