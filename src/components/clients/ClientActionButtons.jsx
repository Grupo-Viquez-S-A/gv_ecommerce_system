import {
  RiStoreFill,
  RiTeamFill,
  RiEyeFill,
  RiEditFill,
  RiUserSharedFill,
} from "react-icons/ri";

import { useAuth } from "../../context/AuthContext.js";
import { hasSystemAccess } from "../../utils/roles.js";

export default function ClientActionButtons({
  client,
  compact = false,
  onOpenBranches,
  onOpenRepresentatives,
  onView,
  onEdit,
  onDeactivate,
}) {
  const { user } = useAuth();
  const canEditClient = hasSystemAccess(user);
  const buttonSize = compact ? "w-7 h-7" : "w-7 h-7";
  const iconSize = compact ? 13 : 14;

  const baseButtonClasses = `
    ${buttonSize}
    rounded-lg
    text-gray-400
    hover:text-white
    hover:bg-[#C9A227]/15
    flex
    items-center
    justify-center
    transition-colors
    cursor-pointer
  `;

  return (
    <div
      className="flex items-center gap-1"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => onOpenBranches(client)}
        className={baseButtonClasses}
        title="Ver sucursales"
        aria-label={`Ver sucursales de ${client.name}`}
      >
        <RiStoreFill size={iconSize} />
      </button>

      <button
        type="button"
        onClick={() => onOpenRepresentatives(client)}
        className={baseButtonClasses}
        title="Ver representantes"
        aria-label={`Ver representantes de ${client.name}`}
      >
        <RiTeamFill size={iconSize} />
      </button>

      <button
        type="button"
        onClick={() => onView(client)}
        className={baseButtonClasses}
        title="Ver cliente"
        aria-label={`Ver detalle de ${client.name}`}
      >
        <RiEyeFill size={iconSize} />
      </button>

      {canEditClient && (
        <button
          type="button"
          onClick={() => onEdit(client)}
          className={baseButtonClasses}
          title="Editar cliente"
          aria-label={`Editar ${client.name}`}
        >
          <RiEditFill size={iconSize} />
        </button>
      )}

      <button
        type="button"
        onClick={() => onDeactivate(client)}
        className={`${buttonSize} rounded-lg text-yellow-400 hover:text-white hover:bg-yellow-500/20 flex items-center justify-center transition-colors cursor-pointer`}
        title="Desactivar cliente"
        aria-label={`Desactivar ${client.name}`}
      >
        <RiUserSharedFill size={iconSize} />
      </button>
    </div>
  );
}
