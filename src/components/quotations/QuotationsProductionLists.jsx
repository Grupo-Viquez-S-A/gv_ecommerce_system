import { useEffect, useState } from "react";
import { RiAddCircleLine, RiArrowDownSFill, RiArrowLeftSLine, RiArrowRightSFill, RiDeleteBinLine, RiDownloadFill, RiExportFill, RiEyeFill, RiLoader4Line, RiMailSendFill, RiMoreFill, RiSearchLine } from "react-icons/ri";
import { QuotationPaginationButton as PagBtn, QuotationStatusBadge as StatusBadge, formatQuotationCurrency as formatCurrency, formatQuotationDate as formatDate } from "./QuotationsViewHelpers.jsx";

export default function QuotationsProductionLists({ activeProductionTab, setActiveProductionTab, filtered, filteredProductionOrders, quotations, productionOrders, loading, ordersLoading, openQuotationModal, setSelectedProductionOrder, onCreateProductionOrder, creatingProductionOrderId, onDownloadQuotation, downloadingQuotationId, onSendQuotation, sendingQuotationId, onDeleteQuotation, onDeleteProductionOrder, clearFilters }) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const productionOrdersByQuotationId = new Map(
    productionOrders
      .filter((order) => order.quotationId)
      .map((order) => [order.quotationId, order]),
  );

  useEffect(() => {
    const handleWindowClick = () => setOpenMenuId(null);

    window.addEventListener("click", handleWindowClick);

    return () => {
      window.removeEventListener("click", handleWindowClick);
    };
  }, []);

  const getQuotationId = (quotation) => quotation?.quotationId || quotation?.id;
  const getProductionOrderId = (order) => order?.productionOrderId || order?.id;

  const renderDownloadButton = (quotation, compact = false) => {
    const quotationId = getQuotationId(quotation);
    const isDownloading = downloadingQuotationId === quotationId;

    return (
      <button
        type="button"
        disabled={isDownloading}
        onClick={(event) => {
          event.stopPropagation();
          onDownloadQuotation?.(quotation);
        }}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg text-gray-400 transition-colors hover:bg-[#C9A227]/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 ${compact ? "h-9 flex-1 border border-[#2a3550] px-3 text-xs font-semibold" : "h-7 w-7"}`}
        title="Descargar proforma PDF"
        aria-label={`Descargar proforma ${quotation.number}`}
      >
        {isDownloading ? <RiLoader4Line size={13} className="animate-spin" /> : <RiDownloadFill size={13} />}
        {compact && "Descargar PDF"}
      </button>
    );
  };

  const renderSendButton = (quotation, compact = false) => {
    const quotationId = getQuotationId(quotation);
    const isSending = sendingQuotationId === quotationId;

    return (
      <button
        type="button"
        disabled={isSending}
        onClick={(event) => {
          event.stopPropagation();
          onSendQuotation?.(quotation);
        }}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg text-gray-400 transition-colors hover:bg-[#C9A227]/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 ${compact ? "h-9 flex-1 border border-[#2a3550] px-3 text-xs font-semibold" : "h-7 w-7"}`}
        title="Enviar proforma al cliente"
        aria-label={`Enviar proforma ${quotation.number}`}
      >
        {isSending ? <RiLoader4Line size={13} className="animate-spin" /> : <RiMailSendFill size={13} />}
        {compact && "Enviar correo"}
      </button>
    );
  };

  const renderProductionOrderButton = (quotation, compact = false) => {
    const quotationId = getQuotationId(quotation);
    const existingOrder = productionOrdersByQuotationId.get(quotationId);

    if (existingOrder) {
      return (
        <span
          className="inline-flex h-7 items-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 text-xs font-semibold text-emerald-300"
          title={existingOrder.code}
        >
          OP creada
        </span>
      );
    }

    const isCreating = creatingProductionOrderId === quotationId;

    return (
      <button
        type="button"
        disabled={isCreating}
        onClick={(event) => {
          event.stopPropagation();
          onCreateProductionOrder?.(quotation);
        }}
        className={`inline-flex h-7 items-center justify-center gap-1.5 rounded-lg border border-[#C9A227]/35 bg-[#C9A227]/10 px-2 text-xs font-semibold text-[#F4C542] transition-colors hover:bg-[#C9A227]/20 disabled:cursor-wait disabled:opacity-70 ${compact ? "flex-1" : ""}`}
        title="Crear orden de produccion"
      >
        {isCreating ? <RiLoader4Line size={13} className="animate-spin" /> : <RiAddCircleLine size={13} />}
        Crear orden de producción
      </button>
    );
  };

  const renderDeleteMenu = ({
    itemId,
    label,
    onDelete,
  }) => {
    const isOpen = openMenuId === itemId;

    return (
      <div className="relative">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setOpenMenuId(isOpen ? null : itemId);
          }}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#C9A227]/15 hover:text-white"
          title="Más opciones"
        >
          <RiMoreFill size={13} />
        </button>

        {isOpen && (
          <div
            className="absolute right-0 top-9 z-20 min-w-[210px] overflow-hidden rounded-xl border border-[#2a3550] bg-[#101827] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setOpenMenuId(null);
                onDelete?.();
              }}
              className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm text-red-200 transition-colors hover:bg-red-500/10"
            >
              <RiDeleteBinLine size={15} />
              {label}
            </button>
          </div>
        )}
      </div>
    );
  };

  return <>
        {/* Listados de producción */}
        <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden mb-6">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#2a3550] px-4 pt-3 sm:px-5">
            <div className="min-w-0 flex-1 overflow-x-auto">
              <div className="flex w-max gap-1">
              <button
                type="button"
                onClick={() => setActiveProductionTab("quotations")}
                className={`rounded-t-lg border border-b-0 px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  activeProductionTab === "quotations"
                    ? "border-[#C9A227]/70 bg-[#0b1424] text-white"
                    : "border-[#2a3550] bg-[#101827] text-gray-400 hover:text-white"
                }`}
              >
                Listado de Cotizaciones
                <span className="ml-2 text-xs text-[#C9A227]">{filtered.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProductionTab("orders")}
                className={`rounded-t-lg border border-b-0 px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  activeProductionTab === "orders"
                    ? "border-[#C9A227]/70 bg-[#0b1424] text-white"
                    : "border-[#2a3550] bg-[#101827] text-gray-400 hover:text-white"
                }`}
              >
                Listado de Órdenes de Producción
                <span className="ml-2 text-xs text-[#C9A227]">{filteredProductionOrders.length}</span>
              </button>
              </div>
            </div>

            <button
              type="button"
              className="mb-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <RiExportFill size={13} />
              Exportar
              <RiArrowDownSFill size={12} />
            </button>
          </div>

          {activeProductionTab === "quotations" && (
            <>
              <table className="hidden w-full text-left lg:table">
                <thead>
                  <tr className="border-b border-[#2a3550]">
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Vigencia</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Vendedor</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#2a3550]">
                  {filtered.map((quotation) => (
                    <tr
                      key={quotation.id}
                      onClick={() => openQuotationModal(quotation)}
                      className="hover:bg-[#1c2538]/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm text-gray-300 font-mono">{quotation.number}</td>
                      <td className="px-4 py-3 text-sm text-white">{quotation.client}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{quotation.company}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{formatDate(quotation.date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{formatDate(quotation.validity)}</td>
                      <td className="px-4 py-3 text-sm text-white font-semibold">{formatCurrency(quotation.total)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#C9A227]/15 flex items-center justify-center text-[10px] font-bold text-[#C9A227]">
                            {quotation.avatar}
                          </div>
                          <span className="text-sm text-gray-300">{quotation.agent}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {renderProductionOrderButton(quotation)}
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openQuotationModal(quotation);
                            }}
                            className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                            title="Ver"
                          >
                            <RiEyeFill size={13} />
                          </button>
                          {renderDownloadButton(quotation)}
                          {renderSendButton(quotation)}
                          {renderDeleteMenu({
                            itemId: `quotation-${getQuotationId(quotation)}`,
                            label: "Eliminar cotización",
                            onDelete: () => onDeleteQuotation?.(quotation),
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && filtered.length > 0 && (
                <div className="divide-y divide-[#2a3550] lg:hidden">
                  {filtered.map((quotation) => (
                    <div
                      key={quotation.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openQuotationModal(quotation)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openQuotationModal(quotation);
                        }
                      }}
                      className="block w-full p-4 text-left transition-colors hover:bg-[#1c2538]/60"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{quotation.client}</p>
                          <p className="mt-1 font-mono text-xs text-gray-400">{quotation.number}</p>
                        </div>
                        <p className="whitespace-nowrap text-sm font-bold text-white">{formatCurrency(quotation.total)}</p>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div><p className="text-gray-500">Fecha</p><p className="mt-1 text-gray-300">{formatDate(quotation.date)}</p></div>
                        <div><p className="text-gray-500">Vigencia</p><p className="mt-1 text-gray-300">{formatDate(quotation.validity)}</p></div>
                      </div>
                      <p className="mt-3 truncate text-xs text-gray-400">{quotation.agent}</p>
                      <div className="mt-3 flex gap-2">
                        {renderProductionOrderButton(quotation, true)}
                        {renderDownloadButton(quotation, true)}
                        {renderSendButton(quotation, true)}
                      </div>
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteQuotation?.(quotation);
                          }}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-500/25 px-3 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/10"
                        >
                          <RiDeleteBinLine size={13} />
                          Eliminar cotización
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <RiSearchLine size={28} className="text-gray-600 animate-pulse" />
                  <p className="text-sm text-gray-500">Cargando cotizaciones...</p>
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <RiSearchLine size={28} className="text-gray-600" />
                  <p className="text-sm text-gray-500">No se encontraron cotizaciones</p>
                  <button type="button" onClick={clearFilters} className="text-xs text-[#C9A227] hover:underline cursor-pointer">
                    Limpiar filtros
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2a3550] px-4 py-3 sm:px-5">
                <span className="text-xs text-gray-500">
                  Mostrando {filtered.length === 0 ? 0 : 1} a {filtered.length} de {quotations.length} cotizaciones
                </span>
                <div className="flex items-center gap-1">
                  <PagBtn icon={<RiArrowLeftSLine size={14} />} />
                  <span className="sm:hidden"><PagBtn label={1} active /></span>
                  <span className="hidden sm:contents">{[1, 2, 3, 4, 5].map((page) => <PagBtn key={page} label={page} active={page === 1} />)}</span>
                  <PagBtn icon={<RiArrowRightSFill size={14} />} />
                </div>
              </div>
            </>
          )}

          {activeProductionTab === "orders" && (
            <>
              <table className="hidden w-full text-left lg:table">
                <thead>
                  <tr className="border-b border-[#2a3550]">
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Orden</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Cotización</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Producción</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Pago</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Saldo</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Vendedor</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#2a3550]">
                  {filteredProductionOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedProductionOrder(order)}
                      className="cursor-pointer hover:bg-[#1c2538]/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-white font-mono">{order.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-300 font-mono">{order.quotationNumber}</td>
                      <td className="px-4 py-3 text-sm text-white">{order.client}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3"><StatusBadge status={order.productionStatusLabel} /></td>
                      <td className="px-4 py-3"><StatusBadge status={order.paymentStatusLabel} /></td>
                      <td className="px-4 py-3 text-sm text-white font-semibold">{formatCurrency(order.balance)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#C9A227]/15 flex items-center justify-center text-[10px] font-bold text-[#C9A227]">
                            {order.avatar}
                          </div>
                          <span className="text-sm text-gray-300">{order.agent}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end">
                          {renderDeleteMenu({
                            itemId: `order-${getProductionOrderId(order)}`,
                            label: "Eliminar orden de producción",
                            onDelete: () => onDeleteProductionOrder?.(order),
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!ordersLoading && filteredProductionOrders.length > 0 && (
                <div className="divide-y divide-[#2a3550] lg:hidden">
                  {filteredProductionOrders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setSelectedProductionOrder(order)}
                      className="block w-full p-4 text-left transition-colors hover:bg-[#1c2538]/60"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{order.client}</p>
                          <p className="mt-1 font-mono text-xs text-gray-400">{order.code}</p>
                        </div>
                        <p className="whitespace-nowrap text-sm font-bold text-white">{formatCurrency(order.balance)}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StatusBadge status={order.productionStatusLabel} />
                        <StatusBadge status={order.paymentStatusLabel} />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-400">
                        <span>{formatDate(order.createdAt)}</span>
                        <span className="truncate">{order.agent}</span>
                      </div>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteProductionOrder?.(order);
                          }}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-500/25 px-3 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/10"
                        >
                          <RiDeleteBinLine size={13} />
                          Eliminar orden de producción
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {ordersLoading && (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <RiSearchLine size={28} className="text-gray-600 animate-pulse" />
                  <p className="text-sm text-gray-500">Cargando órdenes de producción...</p>
                </div>
              )}

              {!ordersLoading && filteredProductionOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <RiSearchLine size={28} className="text-gray-600" />
                  <p className="text-sm text-gray-500">No se encontraron órdenes de producción</p>
                  <button type="button" onClick={clearFilters} className="text-xs text-[#C9A227] hover:underline cursor-pointer">
                    Limpiar filtros
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2a3550] px-4 py-3 sm:px-5">
                <span className="text-xs text-gray-500">
                  Mostrando {filteredProductionOrders.length === 0 ? 0 : 1} a {filteredProductionOrders.length} de {productionOrders.length} órdenes
                </span>
                <div className="flex items-center gap-1">
                  <PagBtn icon={<RiArrowLeftSLine size={14} />} />
                  <span className="sm:hidden"><PagBtn label={1} active /></span>
                  <span className="hidden sm:contents">{[1, 2, 3, 4, 5].map((page) => <PagBtn key={page} label={page} active={page === 1} />)}</span>
                  <PagBtn icon={<RiArrowRightSFill size={14} />} />
                </div>
              </div>
            </>
          )}
        </div>
  </>;
}
