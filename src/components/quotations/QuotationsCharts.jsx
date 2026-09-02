import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { QUOTATION_AREA_DATA as areaData, QUOTATION_LINE_DATA as lineData, formatQuotationCurrency as formatCurrency } from "./QuotationsViewHelpers.jsx";

export default function QuotationsCharts({ quotations, totalQuotedValue }) {
  const averageQuotationValue = quotations.length
    ? totalQuotedValue / quotations.length
    : 0;

  return <>
        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-2">
              Cotizaciones registradas
            </h3>

            <div className="text-xl font-bold text-white mb-1">
              {quotations.length}
            </div>

            <div className="text-xs text-gray-400 mb-4">
              Valor promedio: {formatCurrency(averageQuotationValue)}
            </div>

            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3550" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141d2e",
                      border: "1px solid #2a3550",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#C9A227" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-2">
              Valor total de cotizaciones
            </h3>

            <div className="text-xl font-bold text-white mb-1">
              {formatCurrency(totalQuotedValue)}
            </div>

            <div className="text-xs text-green-400 mb-4">
              +14% vs. mes anterior
            </div>

            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient
                      id="colorValue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#C9A227"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#C9A227"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2a3550"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis hide />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141d2e",
                      border: "1px solid #2a3550",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#C9A227"
                    strokeWidth={2}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-2">
              Tasa de conversión
            </h3>

            <div className="text-xl font-bold text-white mb-1">
              47.7%
            </div>

            <div className="text-xs text-green-400 mb-4">
              +6% vs. mes anterior
            </div>

            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2a3550"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis hide />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141d2e",
                      border: "1px solid #2a3550",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#22c55e" }}
                  />

                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
  </>;
}
