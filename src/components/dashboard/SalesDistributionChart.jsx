import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  RiArrowRightSLine,
  RiEyeLine,
} from "react-icons/ri";

export default function SalesDistributionChart({
  data = [],
  totalLabel = "₡0 M",
  onViewDetails,
  isLoading = false,
  error = null,
}) {
  const totalSales = data.reduce(
    (total, item) => total + (Number(item.value) || 0),
    0,
  );

  if (error) {
    return (
      <section className="bg-[#1c2538] border border-[#2a3550] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">
          Ventas por Empresa (Acumulado del mes)
        </h3>

        <div className="h-48 flex items-center justify-center text-sm text-red-400 text-center px-4">
          No fue posible cargar la distribución: {error}
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="bg-[#1c2538] border border-[#2a3550] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">
          Ventas por Empresa (Acumulado del mes)
        </h3>

        <div className="h-48 flex items-center justify-center text-sm text-gray-500">
          Cargando distribución...
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#1c2538] border border-[#2a3550] rounded-xl p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-white">
          Ventas por Empresa (Acumulado del mes)
        </h3>

        <button
          type="button"
          onClick={onViewDetails}
          aria-label="Ver detalle de ventas por empresa"
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
        >
          <RiEyeLine size={13} />
        </button>
      </div>

      <div className="h-48 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((item, index) => (
                <Cell
                  key={item.id || item.name || index}
                  fill={item.color || "#C9A227"}
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                backgroundColor: "#1c2538",
                border: "1px solid #2a3550",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              itemStyle={{ color: "#e2e8f0" }}
              labelStyle={{ color: "#94a3b8" }}
              formatter={(value) => [`₡${value} M`, "Ventas"]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
          <span className="text-lg font-bold text-white">
            {totalLabel}
          </span>

          <span className="text-xs text-gray-500">Total</span>
        </div>
      </div>

      <div className="space-y-2 mt-3">
        {data.map((item, index) => {
          const percentage =
            totalSales > 0
              ? Math.round(((Number(item.value) || 0) / totalSales) * 100)
              : 0;

          return (
            <div
              key={item.id || item.name || index}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded flex-shrink-0"
                  style={{ backgroundColor: item.color || "#C9A227" }}
                />

                <span className="text-gray-300 truncate">
                  {item.name}
                </span>
              </div>

              <div className="text-right whitespace-nowrap">
                <span className="text-white font-medium">
                  ₡{item.value} M
                </span>

                <span className="text-gray-500 ml-2">
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {onViewDetails && (
        <div className="mt-3 pt-3 border-t border-[#2a3550] flex justify-end">
          <button
            type="button"
            onClick={onViewDetails}
            className="text-xs text-[#C9A227] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            Ver detalle
            <RiArrowRightSLine size={12} />
          </button>
        </div>
      )}
    </section>
  );
}