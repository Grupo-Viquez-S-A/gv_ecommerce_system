import {
  RiCheckboxCircleFill,
  RiCloseCircleFill,
} from "react-icons/ri";

export default function AgentStatusBadge({
  status,
  compact = false,
}) {
  const isActive = status === "Activo";

  const baseClasses = compact
    ? "px-2 py-0.5 text-xs"
    : "px-2.5 py-1 text-xs";

  const statusClasses = isActive
    ? "text-green-400 bg-green-400/10"
    : "text-red-400 bg-red-400/10";

  return (
    <span
      className={`
        flex items-center gap-1
        font-medium
        rounded-full
        w-fit
        ${baseClasses}
        ${statusClasses}
      `}
    >
      {isActive ? (
        <RiCheckboxCircleFill size={compact ? 11 : 12} />
      ) : (
        <RiCloseCircleFill size={compact ? 11 : 12} />
      )}

      {status}
    </span>
  );
}