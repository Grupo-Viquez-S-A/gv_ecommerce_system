import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatSalesCurrency } from "./salesViewConfig.js";

export default function SalesChart({ data }) {
  return (
    <section className="mb-6 rounded-xl border border-[#2a3550] bg-[#141d2e] p-4">
      <h2 className="mb-4 text-sm font-semibold text-white">Ventas pagadas por día</h2>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs><linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C9A227" stopOpacity={0.3} /><stop offset="95%" stopColor="#C9A227" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3550" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: "#141d2e", border: "1px solid #2a3550", borderRadius: "8px", fontSize: "12px", color: "#fff" }} itemStyle={{ color: "#fff" }} formatter={(value) => [formatSalesCurrency(value), "Ventas"]} />
            <Area type="monotone" dataKey="value" stroke="#C9A227" strokeWidth={2} fill="url(#colorSales)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
