import { useEffect, useMemo, useState } from "react";
import { RiCheckboxCircleFill, RiFileList3Fill, RiSettings3Fill, RiTimeFill } from "react-icons/ri";

import ClientSummaryCard from "../components/clientPanel/ClientSummaryCard.jsx";
import MyOrdersList from "../components/clientPanel/MyOrdersList.jsx";
import OrderDetailModal from "../components/clientPanel/OrderDetailModal.jsx";
import {
  getMyOrderDetail,
  getMyProductionOrders,
} from "../services/clientPanelService.js";

function isStatusOneOf(status, values) {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  return values.includes(normalizedStatus);
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setError("");
        const rows = await getMyProductionOrders();

        if (mounted) {
          setOrders(rows);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message || "No fue posible cargar tus pedidos.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadOrderDetail() {
      if (!selectedOrder?.productionOrderId) {
        setOrderDetail(null);
        setDetailError("");
        setDetailLoading(false);
        return;
      }

      try {
        setDetailLoading(true);
        setDetailError("");
        const detail = await getMyOrderDetail(selectedOrder.productionOrderId);

        if (mounted) {
          setOrderDetail(detail);
        }
      } catch (loadError) {
        if (mounted) {
          setOrderDetail(null);
          setDetailError(loadError.message || "No fue posible cargar el detalle.");
        }
      } finally {
        if (mounted) {
          setDetailLoading(false);
        }
      }
    }

    loadOrderDetail();

    return () => {
      mounted = false;
    };
  }, [selectedOrder]);

  const closeDetail = () => {
    setSelectedOrder(null);
    setOrderDetail(null);
    setDetailError("");
  };

  const summary = useMemo(() => {
    const pending = orders.filter((order) =>
      isStatusOneOf(order.productionStatus, ["pending", "pendiente", "created", "draft"]),
    ).length;

    const inProcess = orders.filter((order) =>
      isStatusOneOf(order.productionStatus, ["process", "processing", "progress", "en proceso", "in_progress"]),
    ).length;

    const completed = orders.filter((order) =>
      isStatusOneOf(order.productionStatus, ["completed", "finalizado", "entregado", "delivered", "finished"]),
    ).length;

    return { pending, inProcess, completed };
  }, [orders]);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white lg:text-3xl">Mis pedidos</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-400">
          Revisa tus pedidos de produccion relacionados con cotizaciones asociadas a tu usuario.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ClientSummaryCard icon={<RiFileList3Fill size={22} />} label="Total de pedidos" value={orders.length} tone="gold" />
        <ClientSummaryCard icon={<RiTimeFill size={22} />} label="Pendientes" value={summary.pending} tone="blue" />
        <ClientSummaryCard icon={<RiSettings3Fill size={22} />} label="En proceso" value={summary.inProcess} tone="purple" />
        <ClientSummaryCard icon={<RiCheckboxCircleFill size={22} />} label="Finalizados" value={summary.completed} tone="green" />
      </div>

      <section className="rounded-lg border border-[#2a3550] bg-[#141d2e]/50 p-4 lg:p-5">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Listado de pedidos</h2>
            <p className="text-sm text-gray-500">Informacion read-only de ordenes de produccion filtradas por tus cotizaciones.</p>
          </div>
        </div>

        {loading && (
          <div className="rounded-lg border border-[#2a3550] bg-[#1b2538] px-6 py-10 text-center text-sm text-gray-400">
            Cargando tus pedidos...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && (
          <MyOrdersList orders={orders} onSelectOrder={setSelectedOrder} />
        )}
      </section>

      <OrderDetailModal
        isOpen={Boolean(selectedOrder)}
        order={orderDetail}
        loading={detailLoading}
        error={detailError}
        onClose={closeDetail}
      />
    </div>
  );
}
