import AgentActionButtons from "./AgentActionButtons.jsx";
import AgentAvatar from "./AgentAvatar.jsx";
import AgentStatusBadge from "./AgentStatusBadge.jsx";

export default function AgentMobileCard({
  agent,
  onView,
  onEdit,
  onDeactivate,
  onDelete,
}) {
  return (
    <article className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <AgentAvatar
            initials={agent.initials}
            color={agent.color}
          />

          <div className="min-w-0">
            <div className="font-medium text-white text-sm truncate">
              {agent.name}
            </div>

            <div className="text-xs text-gray-500 truncate">
              {agent.company}
            </div>
          </div>
        </div>

        <AgentStatusBadge
          status={agent.status}
          compact
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-white font-semibold">
          {agent.sales}
        </span>

        <span className="text-gray-500 text-xs">
          {agent.clientsCount} clientes
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-[#2a3550]">
        <AgentActionButtons
          agent={agent}
          onView={onView}
          onEdit={onEdit}
          onDeactivate={onDeactivate}
          onDelete={onDelete}
          compact
        />
      </div>
    </article>
  );
}