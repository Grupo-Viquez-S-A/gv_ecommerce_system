import {
  RiBarChartBoxFill,
  RiClipboardFill,
  RiGroupFill,
  RiShoppingBagFill,
} from "react-icons/ri";

import DashboardStatCard from "./DashboardStatCard";

export default function DashboardStats({ stats = null, isLoading, error }) {
  const defaultStats = [
    {
      id: "clients",
      icon: <RiGroupFill size={20} />,
      label: "Clientes Totales",
      value: "—",
      colorClass: "bg-[#C9A227]",
    },
    {
      id: "sales",
      icon: <RiBarChartBoxFill size={20} />,
      label: "Ventas Consolidadas",
      value: "—",
      colorClass: "bg-[#f59e0b]",
    },
    {
      id: "quotes",
      icon: <RiClipboardFill size={20} />,
      label: "Cotizaciones Activas",
      value: "—",
      colorClass: "bg-[#6366f1]",
    },
    {
      id: "orders",
      icon: <RiShoppingBagFill size={20} />,
      label: "Pedidos Activos",
      value: "—",
      colorClass: "bg-[#22c55e]",
    },
  ];

  const cards = stats && stats.length > 0 ? stats : defaultStats;

  if (error) {
    return (
      <div className="mb-6 bg-[#1c2538] border border-[#2a3550] rounded-xl p-5 text-sm text-red-400">
        No fue posible cargar las estadísticas: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {cards.map((stat) => (
        <DashboardStatCard
          key={stat.id || stat.label}
          icon={stat.icon}
          label={stat.label}
          value={isLoading ? "…" : stat.value}
          growth={stat.growth}
          colorClass={stat.colorClass}
        />
      ))}
    </div>
  );
}