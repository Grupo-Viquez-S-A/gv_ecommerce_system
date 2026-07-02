import {
  RiCheckboxCircleFill,
  RiCloseCircleFill,
} from "react-icons/ri";

export default function ClientStatusBadge({ status, compact = false }) {
  const isActive = status === "Activo";

  const sizeClasses = compact
    ? "px-2 py-0.5 text-xs"
    : "px-2.5 py-1 text-xs";

  const iconSize = compact ? 11 : 12;

  return (
    <span
      className={`flex items-center gap-1.5 font-medium rounded-full w-fit ${sizeClasses} ${
        isActive
          ? "text-green-400 bg-green-400/10"
          : "text-red-400 bg-red-400/10"
      }`}
    >
      {isActive ? (
        <RiCheckboxCircleFill size={iconSize} />
      ) : (
        <RiCloseCircleFill size={iconSize} />
      )}

      {isActive ? "Activo" : "Inactivo"}
    </span>
  );
}