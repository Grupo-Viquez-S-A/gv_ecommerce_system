import { RiAddFill } from "react-icons/ri";

export default function AgentsPageHeader({ onCreateAgent }) {
  return (
    <section className="flex items-center justify-between mb-5">
      <div>
        <h1 className="text-xl font-bold text-white">Agentes</h1>

        <p className="text-sm text-gray-400 mt-0.5">
          Administra todos los agentes comerciales de la empresa.
        </p>
      </div>

      <button
        type="button"
        onClick={onCreateAgent}
        className="flex items-center gap-2 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-[#C9A227]/20 cursor-pointer"
      >
        <RiAddFill size={16} />
        Nuevo agente
      </button>
    </section>
  );
}