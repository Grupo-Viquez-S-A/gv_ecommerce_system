import {
  RiBriefcaseFill,
  RiClipboardFill,
  RiMailFill,
  RiMoneyDollarCircleFill,
  RiPhoneFill,
  RiStarFill,
  RiStoreFill,
  RiTeamFill,
} from "react-icons/ri";

import AgentAvatar from "./AgentAvatar.jsx";
import AgentStatusBadge from "./AgentStatusBadge.jsx";

function DetailItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-[#2a3550] last:border-b-0">
      <span className="text-gray-500">{icon}</span>

      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm text-white">{value || " - "}</div>
      </div>
    </div>
  );
}

export default function AgentDetails({ agent }) {
  if (!agent) {
    return null;
  }

  return (
    <div className="space-y-5">
      {/* Encabezado del agente */}
      <div className="flex items-center gap-4 pb-5 border-b border-[#2a3550]">
        <AgentAvatar
          initials={agent.initials}
          color={agent.color}
          size="xl"
        />

        <div>
          <h3 className="text-lg font-bold text-white">{agent.name}</h3>

          <div className="mt-1">
            <AgentStatusBadge status={agent.status} />
          </div>
        </div>
      </div>

      {/* Datos de contacto */}
      <section>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Datos de contacto
        </p>

        <div className="space-y-1">
          <DetailItem
            label="Correo"
            value={agent.email}
            icon={<RiMailFill size={12} />}
          />

          <DetailItem
            label="Teléfono"
            value={agent.phone}
            icon={<RiPhoneFill size={12} />}
          />
        </div>
      </section>

      {/* Información comercial */}
      <section>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Información comercial
        </p>

        <div className="space-y-1">
          <DetailItem
            label="Empresa"
            value={agent.company}
            icon={<RiBriefcaseFill size={12} />}
          />

          <DetailItem
            label="Ventas acumuladas"
            value={agent.sales}
            icon={<RiMoneyDollarCircleFill size={12} />}
          />

          <DetailItem
            label="Clientes asignados"
            value={agent.clientsCount}
            icon={<RiTeamFill size={12} />}
          />

          <DetailItem
            label="Cotizaciones"
            value={agent.totalQuotes}
            icon={<RiClipboardFill size={12} />}
          />

          <DetailItem
            label="Pedidos"
            value={agent.totalOrders}
            icon={<RiStoreFill size={12} />}
          />

          <DetailItem
            label="Comisión"
            value={agent.commission}
            icon={<RiStarFill size={12} />}
          />
        </div>
      </section>

      {agent.notes && (
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Notas
          </p>

          <div className="bg-[#222e44] border border-[#2a3550] rounded-lg p-3 text-sm text-gray-300">
            {agent.notes}
          </div>
        </section>
      )}
    </div>
  );
}

