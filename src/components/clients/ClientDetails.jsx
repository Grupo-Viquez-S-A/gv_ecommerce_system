import {
  RiBarChartFill,
  RiBuilding2Fill,
  RiFileList3Fill,
  RiMailFill,
  RiPhoneFill,
  RiPriceTag3Fill,
  RiShoppingBag3Fill,
  RiTimeLine,
} from "react-icons/ri";

import ClientStatusBadge from "./ClientStatusBadge";

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#2a3550] last:border-b-0">
      <div className="mt-0.5 text-gray-500 flex-shrink-0">{icon}</div>

      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>

        <p className="text-sm font-medium text-white break-words">
          {value || "No registrado"}
        </p>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
      {children}
    </h3>
  );
}

export default function ClientDetails({ client }) {
  if (!client) {
    return (
      <div className="rounded-xl border border-[#2a3550] bg-[#1c2538] p-5 text-sm text-gray-400">
        No fue posible cargar la información del cliente.
      </div>
    );
  }

  const clientPhone =
    client.phone ||
    client.clientPhones?.find((phone) => phone.isPrimary)?.phone ||
    client.clientPhones?.[0]?.phone ||
    "";

  const status = client.status || "Activo";

  return (
    <div className="space-y-7">
      {/* Encabezado del cliente */}
      <section className="pb-5 border-b border-[#2a3550]">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
            style={{ backgroundColor: client.color || "#C9A227" }}
          >
            {client.initials || "CL"}
          </div>

          <div className="min-w-0">
            <h2 className="text-xl font-bold text-white truncate">
              {client.name || "Cliente sin nombre"}
            </h2>

            <div className="mt-2">
              <ClientStatusBadge status={status} compact />
            </div>
          </div>
        </div>
      </section>

      {/* Datos de contacto */}
      <section>
        <SectionTitle>Datos de contacto</SectionTitle>

        <div>
          <DetailRow
            icon={<RiMailFill size={15} />}
            label="Correo"
            value={client.email}
          />

          <DetailRow
            icon={<RiPhoneFill size={15} />}
            label="Teléfono"
            value={clientPhone}
          />
        </div>
      </section>

      {/* Información legal */}
      <section>
        <SectionTitle>Información legal</SectionTitle>

        <div>
          <DetailRow
            icon={<RiPriceTag3Fill size={15} />}
            label="Cédula jurídica"
            value={client.legalId}
          />

          <DetailRow
            icon={<RiFileList3Fill size={15} />}
            label="Razón social"
            value={client.legalName}
          />

          <DetailRow
            icon={<RiBarChartFill size={15} />}
            label="Código de actividad"
            value={client.activityCode}
          />
        </div>
      </section>

      {/* Información comercial */}
      <section>
        <SectionTitle>Información comercial</SectionTitle>

        <div>
          <DetailRow
            icon={<RiBuilding2Fill size={15} />}
            label="Empresa del Grupo"
            value={client.company}
          />

          <DetailRow
            icon={<RiBarChartFill size={15} />}
            label="Ventas acumuladas"
            value={client.sales || "â‚¡0 M"}
          />

          <DetailRow
            icon={<RiTimeLine size={15} />}
            label="Última compra"
            value={client.lastPurchase || "Sin compras"}
          />

          <DetailRow
            icon={<RiShoppingBag3Fill size={15} />}
            label="Total de órdenes"
            value={String(client.totalOrders ?? 0)}
          />

          <DetailRow
            icon={<RiFileList3Fill size={15} />}
            label="Cotizaciones"
            value={String(client.totalQuotes ?? 0)}
          />
        </div>
      </section>
    </div>
  );
}
