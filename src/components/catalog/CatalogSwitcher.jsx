import { Package } from "lucide-react";

const CATALOG_OPTIONS = [
  {
    id: "textile_products",
    label: "Catálogo de productos",
    description: "Productos terminados, tallas y medidas.",
    icon: Package,
  },
];

export default function CatalogSwitcher({
  activeCatalog,
  onChange,
}) {
  return (
    <section className="mb-6">
      <div className="mb-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#86A4CE]">
          Tipo de catálogo
        </p>

        <p className="mt-1 text-sm text-slate-400">
          Selecciona el catálogo comercial que deseas consultar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {CATALOG_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = activeCatalog === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange?.(option.id)}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                isActive
                  ? "border-[#D7A91D] bg-[#D7A91D]/10 shadow-[0_8px_20px_rgba(215,169,29,0.12)]"
                  : "border-[#29466F] bg-[#102441] hover:border-[#4B6B96] hover:bg-[#132F58]"
              }`}
              aria-pressed={isActive}
            >
              <div
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
                  isActive
                    ? "bg-[#D7A91D] text-[#071426]"
                    : "bg-[#091A31] text-[#D7A91D]"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p
                  className={`text-sm font-extrabold ${
                    isActive ? "text-white" : "text-[#C9D8EC]"
                  }`}
                >
                  {option.label}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
