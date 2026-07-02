import {
  RiBarChartFill,
  RiBriefcaseFill,
  RiClipboardFill,
  RiMailFill,
  RiMapPinFill,
  RiMoneyDollarCircleFill,
  RiPhoneFill,
  RiTimeLine,
} from "react-icons/ri";
import ClientStatusBadge from "./ClientStatusBadge";

export default function ClientDetails({ client }) {
  if (!client) {
    return null;
  }

  const contactDetails = [
    {
      label: "Correo",
      value: client.email || "No registrado",
      icon: <RiMailFill size={12} />,
    },
    {
      label: "Teléfono",
      value: client.phone || "No registrado",
      icon: <RiPhoneFill size={12} />,
    },
    {
      label: "Dirección",
      value: client.address || "No registrada",
      icon: <RiMapPinFill size={12} />,
    },
  ];

  const businessDetails = [
    {
      label: "Empresa del Grupo",
      value: client.company || "No asignada",
      icon: <RiBriefcaseFill size={12} />,
    },
    {
      label: "Ventas Acumuladas",
      value: client.sales || "₡0",
      icon: <RiMoneyDollarCircleFill size={12} />,
    },
    {
      label: "Última Compra",
      value: client.lastPurchase || "Sin compras registradas",
      icon: <RiTimeLine size={12} />,
    },
    {
      label: "Total de Órdenes",
      value: client.totalOrders ?? 0,
      icon: <RiBarChartFill size={12} />,
    },
    {
      label: "Cotizaciones",
      value: client.totalQuotes ?? 0,
      icon: <RiClipboardFill size={12} />,
    },
  ];

  const renderDetailRow = ({ label, value, icon }) => (
    <div
      key={label}
      className="flex items-center gap-3 py-2 border-b border-[#2a3550] last:border-b-0"
    >
      <span className="text-gray-500">{icon}</span>

      <div className="min-w-0">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm text-white break-words">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Encabezado del cliente */}
      <div className="flex items-center gap-4 pb-5 border-b border-[#2a3550]">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
          style={{ backgroundColor: client.color || "#C9A227" }}
        >
          {client.initials || "CL"}
        </div>

        <div className="min-w-0">
          <h3 className="text-lg font-bold text-white break-words">
            {client.name}
          </h3>

          <div className="mt-1">
            <ClientStatusBadge status={client.status} compact />
          </div>
        </div>
      </div>

      {/* Datos de contacto */}
      <section>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Datos de Contacto
        </p>

        <div className="space-y-0">
          {contactDetails.map(renderDetailRow)}
        </div>
      </section>

      {/* Información comercial */}
      <section>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Información Comercial
        </p>

        <div className="space-y-0">
          {businessDetails.map(renderDetailRow)}
        </div>
      </section>

      {/* Notas internas */}
      {client.notes && (
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Notas internas
          </p>

          <div className="bg-[#1c2538] border border-[#2a3550] rounded-xl p-3">
            <p className="text-sm text-gray-300 whitespace-pre-wrap">
              {client.notes}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}