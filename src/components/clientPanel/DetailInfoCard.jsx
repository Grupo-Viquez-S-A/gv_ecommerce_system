export default function DetailInfoCard({ label, value, helper, icon }) {
  return (
    <div className="rounded-lg border border-[#2a3550] bg-[#182235] p-4">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#C9A227]/25 bg-[#C9A227]/10 text-[#C9A227]">
            {icon}
          </div>
        )}

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-white">
            {value || "No disponible"}
          </p>
          {helper && (
            <p className="mt-1 break-words text-xs text-gray-400">{helper}</p>
          )}
        </div>
      </div>
    </div>
  );
}
