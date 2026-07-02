export default function ChartLegend({ items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
      {items.map((item, index) => (
        <div
          key={item.id || item.name || index}
          className="flex items-center gap-1.5 text-xs text-gray-400"
        >
          <span
            className="w-2.5 h-2.5 rounded flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />

          <span>{item.name}</span>
        </div>
      ))}
    </div>
  );
}