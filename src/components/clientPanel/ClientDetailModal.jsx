import { useEffect } from "react";
import { RiCloseLine } from "react-icons/ri";

export default function ClientDetailModal({
  isOpen,
  title,
  subtitle,
  icon,
  badges,
  loading,
  error,
  onClose,
  children,
  footer,
}) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-[#33415f] bg-[#0f1728] shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#2a3550] bg-[#141d2e] p-5">
          <div className="flex min-w-0 items-start gap-4">
            {icon && (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#C9A227]/30 bg-[#C9A227]/15 text-[#C9A227]">
                {icon}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A227]">
                Detalle
              </p>
              <h2 className="mt-1 break-words text-xl font-black text-white sm:text-2xl">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
              )}
              {badges && (
                <div className="mt-3 flex flex-wrap gap-2">{badges}</div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#2a3550] bg-[#1c2538] text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
            aria-label="Cerrar detalle"
          >
            <RiCloseLine size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-5">
          {loading && (
            <div className="rounded-lg border border-[#2a3550] bg-[#182235] px-6 py-14 text-center text-sm text-gray-400">
              Cargando detalle...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-5 py-4 text-sm text-red-200">
              {error}
            </div>
          )}

          {!loading && !error && children}
        </div>

        {!loading && !error && footer && (
          <div className="border-t border-[#2a3550] px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
