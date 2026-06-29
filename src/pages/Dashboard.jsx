import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import DashSideBar from "../components/dashSideBar.jsx";
import {
  RiShoppingBagFill,
  RiGroupFill,
  RiUserFill,
  RiClipboardFill,
  RiCalendarFill,
  RiSettings4Fill,
  RiNotification3Fill,
  RiArrowDownSFill,
  RiLogoutBoxLine,
  RiCalendarCheckFill,
  RiEyeLine,
  RiCheckFill,
  RiArrowUpLine,
  RiArrowDownLine,
  RiMenuFill,
  RiArrowRightSLine,
  RiBarChartBoxFill,
} from "react-icons/ri";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const companies = [
  { id: "grupo-viquez", name: "Grupo Víquez", color: "#c9a227" },
  { id: "constructora", name: "Constructora Víquez", color: "#C9A227" },
  { id: "occidente-lab", name: "Occidente Lab", color: "#22c55e" },
  { id: "textiles", name: "Textiles de Occidente", color: "#6366f1" },
  { id: "agro", name: "Agro Occidente Group", color: "#f59e0b" },
  { id: "pet-food", name: "Pacific Pet Food", color: "#ec4899" },
];

const barData = [
  { name: "Ene", textiles: 15, lab: 8, petfood: 12, constructora: 6, capital: 5, grupo: 7 },
  { name: "Feb", textiles: 18, lab: 10, petfood: 14, constructora: 8, capital: 6, grupo: 8 },
  { name: "Mar", textiles: 22, lab: 12, petfood: 16, constructora: 9, capital: 7, grupo: 10 },
  { name: "Abr", textiles: 25, lab: 14, petfood: 18, constructora: 10, capital: 8, grupo: 11 },
  { name: "May", textiles: 28, lab: 15, petfood: 20, constructora: 12, capital: 9, grupo: 12 },
  { name: "Jun", textiles: 30, lab: 16, petfood: 22, constructora: 13, capital: 10, grupo: 14 },
];

const donutData = [
  { name: "Textiles de Occidente", value: 45, color: "#6366f1" },
  { name: "Occidente Lab", value: 25, color: "#22c55e" },
  { name: "Pacific Pet Food", value: 52, color: "#ec4899" },
  { name: "Constructora Víquez", value: 38, color: "#C9A227" },
  { name: "Occidente Capital Group", value: 25, color: "#f59e0b" },
];

const topClients = [
  { rank: 1, name: "Hotel Los Laureles", company: "Textiles de Occidente", amount: "₡4.2 M" },
  { rank: 2, name: "Veterinaria Grecia", company: "Pacific Pet Food", amount: "₡3.6 M" },
  { rank: 3, name: "Constructora Víquez", company: "Textiles de Occidente", amount: "₡2.8 M" },
  { rank: 4, name: "Restaurante El Trapiche", company: "Occidente Lab", amount: "₡2.4 M" },
  { rank: 5, name: "Hotel Vista Real", company: "Textiles de Occidente", amount: "₡2.1 M" },
];

const performance = [
  { name: "Textiles de Occidente", amount: "₡45 M", percentage: 92, color: "#6366f1" },
  { name: "Occidente Lab", amount: "₡25 M", percentage: 88, color: "#22c55e" },
  { name: "Pacific Pet Food", amount: "₡52 M", percentage: 105, color: "#ec4899" },
  { name: "Constructora Víquez", amount: "₡38 M", percentage: 95, color: "#C9A227" },
  { name: "Occidente Capital Group", amount: "₡25 M", percentage: 63, color: "#f59e0b" },
];

const advisors = [
  { name: "Zara Méndez", role: "Veterinaria", company: "Pacific Pet Food", amount: "₡38.7 M", percentage: 112 },
  { name: "María José Ramírez", role: "Veterinaria", company: "Agro Occidente", amount: "₡32.1 M", percentage: 103 },
  { name: "Andrés Vargas", role: "Hotel", company: "Camino Real", amount: "₡28.4 M", percentage: 97 },
  { name: "Sofía Jiménez", role: "Asesora", company: "Lavandería", amount: "₡21.8 M", percentage: 91 },
  { name: "Kevin Araya", role: "Asesor", company: "Pet Shop", amount: "₡19.5 M", percentage: 89 },
];

const activities = [
  { user: "Zara Méndez", action: "agregó un nuevo cliente", target: "Veterinaria Abuelo - Pacific Pet Food", time: "Hoy, 10:15 a.m.", icon: "user" },
  { user: "María José Ramírez", action: "envió una cotización", target: "Constructora San Carlos - Textiles", time: "Hoy, 9:42 a.m.", icon: "file" },
  { user: "Andrés Vargas", action: "confirmó un pedido", target: "Hotel Camino Real - Textiles", time: "Hoy, 9:10 a.m.", icon: "cart" },
  { user: "Sofía Jiménez", action: "cerró una venta", target: "Lavandería El Sol - Occidente Lab", time: "Ayer, 4:30 p.m.", icon: "chart" },
  { user: "Kevin Araya", action: "generó una cotización", target: "Pet Shop San Rafael - Pacific Pet Food", time: "Ayer, 3:15 p.m.", icon: "file" },
];

const avatarColors = ["#6366f1", "#ec4899", "#C9A227", "#f59e0b", "#22c55e"];

function Dashboard() {
  const { user } = useAuth();
  const [currentCompany, setCurrentCompany] = useState(() =>
    user?.activeCompany ? { ...user.activeCompany, color: user.activeCompany.color || "#c9a227" } : (user?.companies?.[0] ? { ...user.companies[0], color: "#c9a227" } : companies[0])
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [companyDropdown, setCompanyDropdown] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  const StatCard = ({ icon, label, value, growth, colorClass }) => (
    <div className="bg-[#141a2a] border border-[#1f2a40] rounded-xl p-5 flex-1 min-w-[200px]">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${colorClass}`}>
          {icon}
        </div>
      </div>
      <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</div>
      <div className="text-white text-2xl font-bold mb-1">{value}</div>
      <div className="flex items-center gap-1 text-xs">
        <span className="text-green-400 flex items-center gap-0.5">
          <RiArrowUpLine size={12} />{growth}
        </span>
        <span className="text-gray-500">vs. mes anterior</span>
      </div>
    </div>
  );

  return (
    <div className="w-full h-screen bg-[#0B1120] text-white flex overflow-hidden">
      {/* Sidebar */}
      <DashSideBar
        sidebarCollapsed={sidebarCollapsed}
        sidebarOpen={sidebarOpen}
        currentCompany={currentCompany}
        toggleCollapse={toggleCollapse}
        toggleSidebar={toggleSidebar}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="h-14 bg-[#0f1623] border-b border-[#1f2a40] flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-white">
              <RiMenuFill size={22} />
            </button>
            <div className="relative">
              <button
                onClick={() => setCompanyDropdown(!companyDropdown)}
                className="flex items-center gap-2 text-sm font-medium text-white hover:bg-[#141a2a] px-3 py-1.5 rounded-lg transition-colors"
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentCompany.color }} />
                {currentCompany.name}
                <RiArrowDownSFill size={16} className="text-gray-400" />
              </button>
              {companyDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-[#141a2a] border border-[#1f2a40] rounded-lg shadow-xl z-50 py-1">
                  {(user?.companies || companies).map((c, i) => (
                    <button
                      key={c.id}
                      onClick={() => { setCurrentCompany({ ...c, color: c.color || avatarColors[i % avatarColors.length] }); setCompanyDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#1e3a5f] transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color || avatarColors[i % avatarColors.length] }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-lg bg-[#141a2a] border border-[#1f2a40] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1e3a5f] transition-colors">
              <RiNotification3Fill size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="w-9 h-9 rounded-lg bg-[#141a2a] border border-[#1f2a40] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1e3a5f] transition-colors">
              <RiSettings4Fill size={16} />
            </button>
            <button className="w-9 h-9 rounded-lg bg-[#141a2a] border border-[#1f2a40] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1e3a5f] transition-colors">
              <RiLogoutBoxLine size={16} />
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Greeting */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Bienvenido, {user?.fullName || "Usuario"}</h1>
            <p className="text-sm text-gray-400">{user?.role?.name || "Usuario"}{user?.department?.name ? ` - ${user.department.name}` : ""} · Vista: {user?.activeCompany?.name || "Todas las Empresas"}</p>
            <p className="text-sm text-gray-500 mt-1">Resumen general del desempeño comercial del grupo, equipos y cumplimiento de metas.</p>
          </div>

          {/* Date selector */}
          <div className="flex items-center justify-end mb-4">
            <button className="flex items-center gap-2 text-sm text-gray-400 bg-[#141a2a] border border-[#1f2a40] rounded-lg px-3 py-2 hover:text-white transition-colors">
              <RiCalendarCheckFill size={14} />
              1 - 30 de junio, 2024
              <RiArrowDownSFill size={14} />
            </button>
          </div>

          {/* Stat Cards */}
          <div className="flex flex-wrap gap-4 mb-6">
            <StatCard
              icon={<RiGroupFill size={20} />}
              label="Clientes Totales"
              value="2,845"
              growth="+16%"
              colorClass="bg-[#C9A227]"
            />
            <StatCard
              icon={<RiBarChartBoxFill size={20} />}
              label="Ventas Consolidadas"
              value="₡185 M"
              growth="+14%"
              colorClass="bg-[#f59e0b]"
            />
            <StatCard
              icon={<RiClipboardFill size={20} />}
              label="Cotizaciones Activas"
              value="126"
              growth="+9%"
              colorClass="bg-[#6366f1]"
            />
            <StatCard
              icon={<RiShoppingBagFill size={20} />}
              label="Pedidos Activos"
              value="247"
              growth="+12%"
              colorClass="bg-[#22c55e]"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Bar Chart */}
            <div className="lg:col-span-2 bg-[#141a2a] border border-[#1f2a40] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Ventas Consolidadas del Grupo (Todas las empresas)</h3>
                <button className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                  Este año <RiArrowDownSFill size={12} />
                </button>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2a40" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={(v) => `₡${v} M`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#141a2a", border: "1px solid #1f2a40", borderRadius: "8px", fontSize: "12px" }}
                      itemStyle={{ color: "#e2e8f0" }}
                    />
                    <Bar dataKey="textiles" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="lab" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="petfood" stackId="a" fill="#ec4899" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="constructora" stackId="a" fill="#C9A227" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="capital" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="grupo" stackId="a" fill="#c9a227" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                {["#6366f1", "#22c55e", "#ec4899", "#C9A227", "#f59e0b", "#c9a227"].map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: c }} />
                    {donutData[i]?.name || "Grupo Víquez"}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1f2a40]">
                <span className="text-xs text-gray-500">Total acumulado del año</span>
                <span className="text-sm font-bold text-[#C9A227]">₡1,050 M</span>
              </div>
            </div>

            {/* Donut Chart */}
            <div className="bg-[#141a2a] border border-[#1f2a40] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Ventas por Empresa (Acumulado del mes)</h3>
                <button className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                  <RiEyeLine size={12} />
                </button>
              </div>
              <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#141a2a", border: "1px solid #1f2a40", borderRadius: "8px", fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-lg font-bold text-white">₡185 M</span>
                  <span className="text-xs text-gray-500">Total</span>
                </div>
              </div>
              <div className="space-y-2 mt-3">
                {donutData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-300">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-medium">₡{item.value} M</span>
                      <span className="text-gray-500 ml-2">{Math.round((item.value / 185) * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Clients */}
          <div className="bg-[#141a2a] border border-[#1f2a40] rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Top 5 Clientes por Ventas</h3>
              <button className="text-xs text-[#C9A227] hover:text-white flex items-center gap-1">
                Este mes <RiArrowDownSFill size={12} />
              </button>
            </div>
            <div className="space-y-3">
              {topClients.map((client, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#1f2a40] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-[#c9a227] text-[#0B1120]" : "bg-[#1e3a5f] text-white"}`}>
                      {client.rank}
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">{client.name}</div>
                      <div className="text-xs text-gray-500">{client.company}</div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-white">{client.amount}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[#1f2a40] flex justify-end">
              <button className="text-xs text-[#C9A227] hover:text-white flex items-center gap-1">
                Ver todos los clientes <RiArrowRightSLine size={12} />
              </button>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Performance by Company */}
            <div className="bg-[#141a2a] border border-[#1f2a40] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Rendimiento por Empresa (Acumulado del mes)</h3>
              </div>
              <div className="space-y-3">
                {performance.map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-[#1e3a5f] flex items-center justify-center text-xs" style={{ color: item.color }}>
                          {i + 1}
                        </div>
                        <span className="text-gray-300">{item.name}</span>
                      </div>
                      <span className="text-white font-medium">{item.amount}</span>
                    </div>
                    <div className="w-full h-2 bg-[#1e3a5f] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(item.percentage, 100)}%`, backgroundColor: item.color }} />
                    </div>
                    <div className="text-right text-xs text-gray-500 mt-0.5">{item.percentage}%</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#1f2a40] flex justify-end">
                <button className="text-xs text-[#C9A227] hover:text-white flex items-center gap-1">
                  Ver reporte completo <RiArrowRightSLine size={12} />
                </button>
              </div>
            </div>

            {/* Advisor Ranking */}
            <div className="bg-[#141a2a] border border-[#1f2a40] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Rendimiento por Asesor (Ventas del mes)</h3>
                <button className="text-xs text-[#C9A227] hover:text-white flex items-center gap-1">
                  Este mes <RiArrowDownSFill size={12} />
                </button>
              </div>
              <div className="space-y-3">
                {advisors.map((advisor, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? "bg-[#c9a227] text-[#0B1120]" : "bg-[#1e3a5f] text-white"}`}>
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-sm text-white font-medium">{advisor.name}</div>
                          <div className="text-xs text-gray-500">{advisor.role} · {advisor.company}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">{advisor.amount}</div>
                        <div className={`text-xs font-medium ${advisor.percentage >= 100 ? "text-green-400" : "text-yellow-400"}`}>
                          {advisor.percentage}%
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-[#1e3a5f] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${advisor.percentage >= 100 ? "bg-green-400" : "bg-[#c9a227]"}`} style={{ width: `${Math.min(advisor.percentage, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#1f2a40] flex justify-end">
                <button className="text-xs text-[#C9A227] hover:text-white flex items-center gap-1">
                  Ver ranking completo <RiArrowRightSLine size={12} />
                </button>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-[#141a2a] border border-[#1f2a40] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Actividad Reciente (Todo el equipo)</h3>
                <button className="text-xs text-[#C9A227] hover:text-white flex items-center gap-1">
                  Ver todo <RiArrowRightSLine size={12} />
                </button>
              </div>
              <div className="space-y-3">
                {activities.map((act, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b border-[#1f2a40] last:border-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      act.icon === "user" ? "bg-[#C9A227]/20 text-[#C9A227]" :
                      act.icon === "file" ? "bg-[#6366f1]/20 text-[#6366f1]" :
                      act.icon === "cart" ? "bg-[#22c55e]/20 text-[#22c55e]" :
                      "bg-[#f59e0b]/20 text-[#f59e0b]"
                    }`}>
                      {act.icon === "user" && <RiUserFill size={14} />}
                      {act.icon === "file" && <RiClipboardFill size={14} />}
                      {act.icon === "cart" && <RiShoppingBagFill size={14} />}
                      {act.icon === "chart" && <RiBarChartBoxFill size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white">
                        <span className="font-medium">{act.user}</span>{" "}
                        <span className="text-gray-400">{act.action}</span>{" "}
                        <span className="text-gray-300">{act.target}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{act.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center text-xs text-gray-600 py-2">
            <span className="mr-2">🔄</span>
            Los datos se actualizan en tiempo real.
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
