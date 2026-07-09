import { Boxes, PackageOpen } from 'lucide-react';

export default function CatalogHeader({ totalProducts = 0 }) {
  return (
    <section className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Boxes className="h-4 w-4 text-[#D7A91D]" />

          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#D7A91D]">
            Catálogo comercial
          </span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Catálogo de productos
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
          Explora los productos disponibles de Grupo Víquez y sus empresas.
        </p>
      </div>

      <div
        className="
          flex min-w-[190px] items-center gap-3 rounded-xl border
          border-[#2A4670] bg-[#0E2445] px-4 py-3
        "
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#132F58]">
          <PackageOpen className="h-5 w-5 text-[#D7A91D]" />
        </div>

        <div>
          <p className="text-xs text-slate-400">Productos disponibles</p>

          <p className="mt-0.5 text-lg font-extrabold leading-none text-white">
            {totalProducts}
          </p>
        </div>
      </div>
    </section>
  );
}
