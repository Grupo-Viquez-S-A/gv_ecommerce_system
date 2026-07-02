export default function DashboardFooter({
  message = "Los datos se actualizan en tiempo real.",
}) {
  return (
    <div className="flex items-center justify-center text-xs text-gray-600 py-2">
      <span className="mr-2">🔄</span>
      {message}
    </div>
  );
}