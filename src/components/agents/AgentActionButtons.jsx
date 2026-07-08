import {
  RiDeleteBinFill,
  RiEditFill,
  RiEyeFill,
  RiUserSharedFill,
} from "react-icons/ri";

export default function AgentActionButtons({
  agent,
  onView,
  onEdit,
  onDeactivate,
  onDelete,
  compact = false,
}) {
  const buttonSize = compact ? "w-7 h-7" : "w-7 h-7";
  const iconSize = compact ? 13 : 14;
  const hasSecondaryActions = onEdit || onDeactivate || onDelete;

  return (
    <div className="flex items-center gap-1">
      {onView && (
        <button
          type="button"
          onClick={() => onView(agent)}
          className={`${buttonSize} rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer`}
          title="Ver agente"
          aria-label={`Ver a ${agent.name}`}
        >
          <RiEyeFill size={iconSize} />
        </button>
      )}

      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(agent)}
          className={`${buttonSize} rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer`}
          title="Editar agente"
          aria-label={`Editar a ${agent.name}`}
        >
          <RiEditFill size={iconSize} />
        </button>
      )}

      {onDeactivate && (
        <button
          type="button"
          onClick={() => onDeactivate(agent)}
          className={`${buttonSize} rounded-lg ${
            compact ? "text-yellow-400" : "text-gray-400"
          } hover:text-white hover:bg-yellow-500/20 flex items-center justify-center transition-colors cursor-pointer`}
          title="Desactivar agente"
          aria-label={`Desactivar a ${agent.name}`}
        >
          <RiUserSharedFill size={iconSize} />
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(agent)}
          className={`${buttonSize} rounded-lg ${
            compact ? "text-red-400" : "text-gray-400"
          } hover:text-white hover:bg-red-500/20 flex items-center justify-center transition-colors cursor-pointer`}
          title="Eliminar agente"
          aria-label={`Eliminar a ${agent.name}`}
        >
          <RiDeleteBinFill size={iconSize} />
        </button>
      )}

      {!onView && !hasSecondaryActions && (
        <span className="text-xs text-gray-500">Sin acciones</span>
      )}
    </div>
  );
}
