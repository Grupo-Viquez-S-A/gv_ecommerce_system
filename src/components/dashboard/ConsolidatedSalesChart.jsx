import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ChartLegend from "./ChartLegend";

const DEFAULT_LEGEND_ITEMS = [
  { id: "textiles", name: "Textiles de Occidente", color: "#6366f1" },
  { id: "lab", name: "Occidente Lab", color: "#22c55e" },
  { id: "petfood", name: "Pacific Pet Food", color: "#ec4899" },
  { id: "constructora", name: "Constructora Víquez", color: "#C9A227" },
  {
    id: "capital",
    name: "Occidente Capital Group",
    color: "#f59e0b",
  },
  { id: "grupo", name: "Grupo Víquez", color: "#c9a227" },
];

export default function ConsolidatedSalesChart({
  data = [],
  legendItems = DEFAULT_LEGEND_ITEMS,
  periodLabel = "Este año",
  totalLabel = "â‚¡1,050 M",
  onPeriodClick,
}) {
  return (
    <section className="lg:col-span-2 bg-[#1c2538] border border-[#2a3550] rounded-xl p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-white">
          Ventas Consolidadas del Grupo (Todas las empresas)
        </h3>

        <button
          type="button"
          onClick={onPeriodClick}
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
        >
          {periodLabel}
          <span className="text-sm leading-none">âŒ„</span>
        </button>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2a3550"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickFormatter={(value) => `â‚¡${value} M`}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#1c2538",
                border: "1px solid #2a3550",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              itemStyle={{ color: "#e2e8f0" }}
              labelStyle={{ color: "#94a3b8" }}
              formatter={(value) => [`â‚¡${value} M`, "Ventas"]}
            />

            <Bar
              dataKey="textiles"
              stackId="sales"
              fill="#6366f1"
              radius={[0, 0, 0, 0]}
            />

            <Bar
              dataKey="lab"
              stackId="sales"
              fill="#22c55e"
              radius={[0, 0, 0, 0]}
            />

            <Bar
              dataKey="petfood"
              stackId="sales"
              fill="#ec4899"
              radius={[0, 0, 0, 0]}
            />

            <Bar
              dataKey="constructora"
              stackId="sales"
              fill="#C9A227"
              radius={[0, 0, 0, 0]}
            />

            <Bar
              dataKey="capital"
              stackId="sales"
              fill="#f59e0b"
              radius={[0, 0, 0, 0]}
            />

            <Bar
              dataKey="grupo"
              stackId="sales"
              fill="#c9a227"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ChartLegend items={legendItems} />

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2a3550]">
        <span className="text-xs text-gray-500">
          Total acumulado del año
        </span>

        <span className="text-sm font-bold text-[#C9A227]">
          {totalLabel}
        </span>
      </div>
    </section>
  );
}
