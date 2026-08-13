import {
  RiDeleteBinLine,
  RiStoreFill,
  RiTeamFill,
  RiEyeFill,
  RiEditFill,
  RiMapPinFill,
  RiUserSharedFill,
} from "react-icons/ri";

import { useAuth } from "../../context/AuthContext.js";
import {
  hasClientDeletionAccess,
  hasSystemAccess,
  isSalesAgent,
} from "../../utils/roles.js";

export default function ClientActionButtons({
  client,
  compact = false,
  onOpenBranches,
  onOpenRepresentatives,
  onView,
  onEdit,
  onDeactivate,
  onDelete,
}) {
  const { user } = useAuth();
  const canManageClient = hasSystemAccess(user);
  const canEditClient = canManageClient || isSalesAgent(user);
  const canDeactivateClient = canManageClient;
  const canDeleteClient = hasClientDeletionAccess(user);
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
          title={canManageClient ? "Editar cliente" : "Actualizar ubicación"}
          aria-label={
            canManageClient
              ? `Editar ${client.name}`
              : `Actualizar ubicación de ${client.name}`
          }
        >
          {canManageClient ? (
            <RiEditFill size={iconSize} />
          ) : (
            <RiMapPinFill size={iconSize} />
          )}
        </button>
      )}

      {canDeactivateClient && (
        <button
          type="button"
          onClick={() => onDeactivate(client)}
          className={`${buttonSize} rounded-lg text-yellow-400 hover:text-white hover:bg-yellow-500/20 flex items-center justify-center transition-colors cursor-pointer`}
          title="Desactivar cliente"
          aria-label={`Desactivar ${client.name}`}
        >
          <RiUserSharedFill size={iconSize} />
        </button>
      )}

      {canDeleteClient && (
        <button
          type="button"
          onClick={() => onDelete(client)}
          className={`${buttonSize} rounded-lg text-red-300 hover:text-white hover:bg-red-500/15 flex items-center justify-center transition-colors cursor-pointer`}
          title="Eliminar cliente"
          aria-label={`Eliminar ${client.name}`}
        >
          <RiDeleteBinLine size={iconSize} />
        </button>
      )}
    </div>
  );
}
