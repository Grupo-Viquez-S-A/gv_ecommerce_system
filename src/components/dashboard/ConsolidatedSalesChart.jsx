import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RiArrowDownSLine } from "react-icons/ri";

import ChartLegend from "./ChartLegend";

function formatMillionsLabel(value) {
  const numericValue = Number(value) || 0;

  if (numericValue === 0) {
    return "₡0";
  }

  if (Math.abs(numericValue) < 1) {
    return `₡${Math.round(numericValue * 1000).toLocaleString("es-CR")} mil`;
  }

  return `₡${numericValue.toFixed(numericValue >= 10 ? 0 : 1)} M`;
}

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
  totalLabel = "₡0 M",
  onPeriodClick,
  isLoading = false,
  error = null,
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
          <RiArrowDownSLine size={14} />
        </button>
      </div>

      {error ? (
        <div className="h-56 flex items-center justify-center text-sm text-red-400 text-center px-4">
          No fue posible cargar las ventas: {error}
        </div>
      ) : isLoading ? (
        <div className="h-56 flex items-center justify-center text-sm text-gray-500">
          Cargando ventas...
        </div>
      ) : data.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-sm text-gray-500">
          No hay ventas registradas todavía.
        </div>
      ) : (
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
                tickFormatter={(value) => formatMillionsLabel(value)}
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
                formatter={(value) => [formatMillionsLabel(value), "Ventas"]}
              />

              {legendItems.map((item, index) => (
                <Bar
                  key={item.id || item.name}
                  dataKey={item.id}
                  stackId="sales"
                  fill={item.color}
                  radius={
                    index === legendItems.length - 1
                      ? [4, 4, 0, 0]
                      : [0, 0, 0, 0]
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

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
