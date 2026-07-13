export default function SalesStatusBadge({ status, label, config }) {
  const resolvedConfig = config[status] || { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20" };
  return <span className={`inline-block rounded-md border px-2.5 py-1 text-xs font-medium ${resolvedConfig.bg} ${resolvedConfig.text} ${resolvedConfig.border}`}>{label}</span>;
}
