import { RiArrowDownSFill, RiArrowLeftSLine, RiArrowRightSFill, RiDownloadFill, RiExportFill, RiEyeFill, RiMailSendFill, RiMoreFill, RiSearchLine } from "react-icons/ri";
import { QuotationPaginationButton as PagBtn, QuotationStatusBadge as StatusBadge, formatQuotationCurrency as formatCurrency, formatQuotationDate as formatDate } from "./QuotationsViewHelpers.jsx";

export default function QuotationsProductionLists({ activeProductionTab, setActiveProductionTab, filtered, filteredProductionOrders, quotations, productionOrders, loading, ordersLoading, openQuotationModal, setSelectedProductionOrder, clearFilters }) {
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
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
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
                      <td className="px-4 py-3"><StatusBadge status={quotation.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#C9A227]/15 flex items-center justify-center text-[10px] font-bold text-[#C9A227]">
                            {quotation.avatar}
                          </div>
                          <span className="text-sm text-gray-300">{quotation.agent}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5">
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
                          <button type="button" className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer" title="Descargar">
                            <RiDownloadFill size={13} />
                          </button>
                          <button type="button" className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer" title="Enviar">
                            <RiMailSendFill size={13} />
                          </button>
                          <button type="button" className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer" title="Más opciones">
                            <RiMoreFill size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && filtered.length > 0 && (
                <div className="divide-y divide-[#2a3550] lg:hidden">
                  {filtered.map((quotation) => (
                    <button
                      key={quotation.id}
                      type="button"
                      onClick={() => openQuotationModal(quotation)}
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
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <StatusBadge status={quotation.status} />
                        <span className="truncate text-xs text-gray-400">{quotation.agent}</span>
                      </div>
                    </button>
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
