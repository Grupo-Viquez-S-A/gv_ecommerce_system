import AgentMobileCard from "./AgentMobileCard.jsx";

export default function AgentsMobileList({
  agents = [],
  onView,
  onEdit,
  onDeactivate,
  onDelete,
}) {
  if (agents.length === 0) {
    return null;
  }

  return (
    <section className="md:hidden space-y-3 mb-6">
      {agents.map((agent) => (
        <AgentMobileCard
          key={agent.id}
          agent={agent}
          onView={onView}
          onEdit={onEdit}
          onDeactivate={onDeactivate}
          onDelete={onDelete}
        />
      ))}
    </section>
  );
}