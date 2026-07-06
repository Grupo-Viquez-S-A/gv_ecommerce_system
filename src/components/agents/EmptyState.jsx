export default function EmptyState({
  icon,
  title = "No se encontraron resultados",
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3">
      {icon && (
        <div className="w-14 h-14 rounded-full bg-[#2a3550] flex items-center justify-center text-gray-600">
          {icon}
        </div>
      )}

      <p className="text-sm text-gray-500">{title}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="text-xs text-[#C9A227] hover:underline"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}