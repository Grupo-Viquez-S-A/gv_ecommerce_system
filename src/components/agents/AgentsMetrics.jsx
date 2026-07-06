import {
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiMoneyDollarCircleFill,
  RiUserFill,
} from "react-icons/ri";

import AgentMetricCard from "./AgentMetricCard.jsx";

export default function AgentsMetrics() {
  const metrics = [
    {
      label: "Agentes Totales",
      value: "42",
      icon: <RiUserFill size={20} />,
      iconContainerClass: "bg-[#C9A227]/15",
      iconClass: "text-[#C9A227]",
      growth: "+8",
      growthClass: "text-green-400",
    },
    {
      label: "Activos",
      value: "38",
      icon: <RiCheckboxCircleFill size={20} />,
      iconContainerClass: "bg-[#14301a]",
      iconClass: "text-[#4ade80]",
      growth: "+5",
      growthClass: "text-green-400",
    },
    {
      label: "Inactivos",
      value: "4",
      icon: <RiCloseCircleFill size={20} />,
      iconContainerClass: "bg-[#3b1a1a]",
      iconClass: "text-[#f87171]",
      growth: "-1",
      growthClass: "text-red-400",
    },
    {
      label: "Ventas Acumuladas",
      value: "₡104.0 M",
      icon: <RiMoneyDollarCircleFill size={20} />,
      iconContainerClass: "bg-[#2d200a]",
      iconClass: "text-[#fbbf24]",
      growth: "+18%",
      growthClass: "text-green-400",
    },
  ];

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric) => (
        <AgentMetricCard
          key={metric.label}
          label={metric.label}
          value={metric.value}
          icon={metric.icon}
          iconContainerClass={metric.iconContainerClass}
          iconClass={metric.iconClass}
          growth={metric.growth}
          growthClass={metric.growthClass}
        />
      ))}
    </section>
  );
}