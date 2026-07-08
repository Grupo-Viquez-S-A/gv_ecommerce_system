import { useEffect, useMemo, useState } from "react";
import { RiCheckboxCircleFill, RiFileList3Fill, RiTimeFill, RiErrorWarningFill } from "react-icons/ri";

import ClientSummaryCard from "../components/clientPanel/ClientSummaryCard.jsx";
import MyQuotationsList from "../components/clientPanel/MyQuotationsList.jsx";
import { getMyQuotations } from "../services/clientPanelService.js";

function isStatusOneOf(status, values) {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  return values.includes(normalizedStatus);
}

export default function MyQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadQuotations() {
      try {
        setLoading(true);
        setError("");
        const rows = await getMyQuotations();

        if (mounted) {
          setQuotations(rows);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message || "No fue posible cargar tus cotizaciones.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadQuotations();

    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const pending = quotations.filter((quotation) =>
      isStatusOneOf(quotation.status, ["pending", "pendiente", "draft", "created"]),
    ).length;

    const approved = quotations.filter((quotation) =>
      isStatusOneOf(quotation.status, ["approved", "aprobada", "accepted", "converted", "convertida"]),
    ).length;

    const reviewOrRejected = quotations.filter((quotation) =>
      isStatusOneOf(quotation.status, ["review", "revision", "en revision", "rejected", "rechazada", "declined"]),
    ).length;

    return { pending, approved, reviewOrRejected };
  }, [quotations]);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white lg:text-3xl">Mis cotizaciones</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-400">
          Revisa el estado, productos relacionados y total aproximado de tus cotizaciones.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ClientSummaryCard icon={<RiFileList3Fill size={22} />} label="Total de cotizaciones" value={quotations.length} tone="gold" />
        <ClientSummaryCard icon={<RiTimeFill size={22} />} label="Pendientes" value={summary.pending} tone="blue" />
        <ClientSummaryCard icon={<RiCheckboxCircleFill size={22} />} label="Aprobadas" value={summary.approved} tone="green" />
        <ClientSummaryCard icon={<RiErrorWarningFill size={22} />} label="Revision o rechazadas" value={summary.reviewOrRejected} tone="red" />
      </div>

      <section className="rounded-lg border border-[#2a3550] bg-[#141d2e]/50 p-4 lg:p-5">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Listado de cotizaciones</h2>
            <p className="text-sm text-gray-500">Informacion read-only asociada a tu usuario autenticado.</p>
          </div>
        </div>

        {loading && (
          <div className="rounded-lg border border-[#2a3550] bg-[#1b2538] px-6 py-10 text-center text-sm text-gray-400">
            Cargando tus cotizaciones...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && <MyQuotationsList quotations={quotations} />}
      </section>
    </div>
  );
}

