import {
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiMoneyDollarCircleFill,
  RiUserFill,
} from "react-icons/ri";

import AgentMetricCard from "./AgentMetricCard.jsx";

export default function AgentsMetrics({ agents = [] }) {
  const totalAgents = agents.length;
  const activeAgents = agents.filter((agent) => agent.status === "Activo").length;
  const inactiveAgents = totalAgents - activeAgents;
  const companyCount = new Set(
    agents.map((agent) => agent.company).filter(Boolean),
  ).size;

  const metrics = [
    {
      label: "Agentes Totales",
      value: totalAgents,
      icon: <RiUserFill size={20} />,
      iconContainerClass: "bg-[#C9A227]/15",
      iconClass: "text-[#C9A227]",
    },
    {
      label: "Activos",
      value: activeAgents,
      icon: <RiCheckboxCircleFill size={20} />,
      iconContainerClass: "bg-[#14301a]",
      iconClass: "text-[#4ade80]",
    },
    {
      label: "Inactivos",
      value: inactiveAgents,
      icon: <RiCloseCircleFill size={20} />,
      iconContainerClass: "bg-[#3b1a1a]",
      iconClass: "text-[#f87171]",
    },
    {
      label: "Empresas",
      value: companyCount,
      icon: <RiMoneyDollarCircleFill size={20} />,
      iconContainerClass: "bg-[#2d200a]",
      iconClass: "text-[#fbbf24]",
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
