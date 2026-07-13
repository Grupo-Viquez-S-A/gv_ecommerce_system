import { RiCustomerService2Fill } from "react-icons/ri";

export default function TicketsPageHeader({ requesterName, companyName }) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[#C9A227]">
          <RiCustomerService2Fill size={21} />
          <span className="text-xs font-bold uppercase tracking-[0.18em]">Soporte TI</span>
        </div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Centro de ayuda</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-400">
          Reporta problemas técnicos y consulta el estado de tus solicitudes en un solo lugar.
        </p>
      </div>

      <div className="rounded-lg border border-[#2a3550] bg-[#141d2e] px-3 py-2 text-xs text-gray-400">
        <p>Solicitante: <span className="font-semibold text-gray-200">{requesterName || "Usuario"}</span></p>
        <p className="mt-1">Empresa: <span className="font-semibold text-gray-200">{companyName || "Sin empresa seleccionada"}</span></p>
      </div>
    </header>
  );
}
