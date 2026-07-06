import AgentActionButtons from "./AgentActionButtons.jsx";
import AgentAvatar from "./AgentAvatar.jsx";
import AgentStatusBadge from "./AgentStatusBadge.jsx";

export default function AgentTableRow({
  agent,
  onView,
  onEdit,
  onDeactivate,
  onDelete,
}) {
  return (
    <tr className="hover:bg-[#1c2538]/50 transition-colors">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <AgentAvatar
            initials={agent.initials}
            color={agent.color}
          />

          <div>
            <div className="font-medium text-white text-sm">
              {agent.name}
            </div>

            <div className="text-xs text-gray-500">
              {agent.email}
            </div>
          </div>
        </div>
      </td>

      <td className="px-5 py-3 text-gray-300 text-sm">
        {agent.company}
      </td>

      <td className="px-5 py-3 text-gray-300 text-sm">
        {agent.territory}
      </td>

      <td className="px-5 py-3 text-white font-semibold text-sm">
        {agent.clientsCount}
      </td>

      <td className="px-5 py-3 text-white font-semibold text-sm">
        {agent.sales}
      </td>

      <td className="px-5 py-3">
        <AgentStatusBadge status={agent.status} />
      </td>

      <td className="px-5 py-3">
        <AgentActionButtons
          agent={agent}
          onView={onView}
          onEdit={onEdit}
          onDeactivate={onDeactivate}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}
