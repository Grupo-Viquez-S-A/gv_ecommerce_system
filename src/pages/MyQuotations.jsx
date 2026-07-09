import { useEffect, useMemo, useState } from "react";
import { RiCheckboxCircleFill, RiFileList3Fill, RiMoneyDollarCircleFill, RiWallet3Fill } from "react-icons/ri";

import ClientSummaryCard from "../components/clientPanel/ClientSummaryCard.jsx";
import MyQuotationsList from "../components/clientPanel/MyQuotationsList.jsx";
import QuotationDetailModal from "../components/clientPanel/QuotationDetailModal.jsx";
import formatCurrency from "../utils/formatCurrency.js";
import {
  getMyQuotationDetail,
  getMyQuotations,
} from "../services/clientPanelService.js";

export default function MyQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [quotationDetail, setQuotationDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

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

  useEffect(() => {
    let mounted = true;

    async function loadQuotationDetail() {
      if (!selectedQuotation?.quotationId) {
        setQuotationDetail(null);
        setDetailError("");
        setDetailLoading(false);
        return;
      }

      try {
        setDetailLoading(true);
        setDetailError("");
        const detail = await getMyQuotationDetail(selectedQuotation.quotationId);

        if (mounted) {
          setQuotationDetail(detail);
        }
      } catch (loadError) {
        if (mounted) {
          setQuotationDetail(null);
          setDetailError(loadError.message || "No fue posible cargar el detalle.");
        }
      } finally {
        if (mounted) {
          setDetailLoading(false);
        }
      }
    }

    loadQuotationDetail();

    return () => {
      mounted = false;
    };
  }, [selectedQuotation]);

  const closeDetail = () => {
    setSelectedQuotation(null);
    setQuotationDetail(null);
    setDetailError("");
  };

  const summary = useMemo(() => {
    const totalQuoted = quotations.reduce((sum, quotation) => sum + (Number(quotation.total) || 0), 0);
    const totalAdvance = quotations.reduce((sum, quotation) => sum + (Number(quotation.advancePayment) || 0), 0);
    const totalItems = quotations.reduce((sum, quotation) => sum + (Number(quotation.itemsCount) || 0), 0);

    return { totalQuoted, totalAdvance, totalItems };
  }, [quotations]);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white lg:text-3xl">Mis cotizaciones</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-400">
          Revisa el resumen y los productos de tus cotizaciones aprobadas.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ClientSummaryCard icon={<RiCheckboxCircleFill size={22} />} label="Cotizaciones aprobadas" value={quotations.length} tone="green" />
        <ClientSummaryCard icon={<RiFileList3Fill size={22} />} label="Productos cotizados" value={summary.totalItems} tone="gold" />
        <ClientSummaryCard icon={<RiMoneyDollarCircleFill size={22} />} label="Monto total" value={formatCurrency(summary.totalQuoted, "CRC 0")} tone="blue" />
        <ClientSummaryCard icon={<RiWallet3Fill size={22} />} label="Adelanto total (50%)" value={formatCurrency(summary.totalAdvance, "CRC 0")} tone="red" />
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

        {!loading && !error && (
          <MyQuotationsList
            quotations={quotations}
            onSelectQuotation={setSelectedQuotation}
          />
        )}
      </section>

      <QuotationDetailModal
        isOpen={Boolean(selectedQuotation)}
        quotation={quotationDetail}
        loading={detailLoading}
        error={detailError}
        onClose={closeDetail}
      />
    </div>
  );
}

