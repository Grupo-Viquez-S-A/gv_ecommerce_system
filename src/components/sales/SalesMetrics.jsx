export default function SalesMetrics({ metrics }) {
  return (
    <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Resumen de ventas">
      {metrics.map((metric) => (
        <article key={metric.label} className="rounded-xl border border-[#2a3550] bg-[#141d2e] p-4 transition-colors hover:border-[#C9A227]/20">
          <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${metric.bg}`}><span className="h-4 w-4 rounded-sm" style={{ backgroundColor: metric.color }} /></div>
          <p className="text-xl font-bold text-white">{metric.value}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">{metric.label}</p>
        </article>
      ))}
    </section>
  );
}
