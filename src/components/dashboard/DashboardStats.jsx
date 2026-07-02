import {
  RiBarChartBoxFill,
  RiClipboardFill,
  RiGroupFill,
  RiShoppingBagFill,
} from "react-icons/ri";

import DashboardStatCard from "./DashboardStatCard";

export default function DashboardStats({ stats = [] }) {
  const defaultStats = [
    {
      id: "clients",
      icon: <RiGroupFill size={20} />,
      label: "Clientes Totales",
      value: "2,845",
      growth: "+16%",
      colorClass: "bg-[#C9A227]",
    },
    {
      id: "sales",
      icon: <RiBarChartBoxFill size={20} />,
      label: "Ventas Consolidadas",
      value: "₡185 M",
      growth: "+14%",
      colorClass: "bg-[#f59e0b]",
    },
    {
      id: "quotes",
      icon: <RiClipboardFill size={20} />,
      label: "Cotizaciones Activas",
      value: "126",
      growth: "+9%",
      colorClass: "bg-[#6366f1]",
    },
    {
      id: "orders",
      icon: <RiShoppingBagFill size={20} />,
      label: "Pedidos Activos",
      value: "247",
      growth: "+12%",
      colorClass: "bg-[#22c55e]",
    },
  ];

  const cards = stats.length > 0 ? stats : defaultStats;

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {cards.map((stat) => (
        <DashboardStatCard
          key={stat.id || stat.label}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          growth={stat.growth}
          colorClass={stat.colorClass}
        />
      ))}
    </div>
  );
}