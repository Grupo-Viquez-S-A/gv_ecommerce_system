import formatCurrency from "../../utils/formatCurrency.js";

function ProductThumb({ item }) {
  if (item.imageUrl) {
    return (
      <img
        src={item.imageUrl}
        alt={item.name || "Producto"}
        className="h-20 w-20 rounded-lg border border-[#2a3550] bg-[#0f1728] object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-[#2a3550] bg-[#10192b] text-xs font-bold text-[#C9A227]">
      IMG
    </div>
  );
}

export default function DetailProductsTable({ items = [], emptyMessage }) {
  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed border-[#33415f] bg-[#141d2e]/70 px-6 py-10 text-center text-sm text-gray-400">
        {emptyMessage || "No hay productos relacionados."}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#2a3550] bg-[#182235]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#2a3550]">
          <thead className="bg-[#10192b]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Producto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                SKU
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                Cantidad
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                Unitario
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                IVA
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                Subtotal
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a3550]">
            {items.map((item) => (
              <tr key={item.id || item.quoteProductId} className="hover:bg-[#202b40]">
                <td className="max-w-[280px] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ProductThumb item={item} />
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-white">
                        {item.name || item.productId || "Producto sin nombre"}
                      </p>
                      {item.sizeName && (
                        <span className="mt-1 inline-block rounded-md border border-[#5a8abf]/30 bg-[#132F58] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9BB3D3]">
                          {item.sizeName}
                        </span>
                      )}
                      <p className="mt-0.5 text-xs text-gray-500">
                        {item.productId}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">
                  {item.sku || item.productId || "Sin codigo"}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-300">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-300">
                  {formatCurrency(item.unitPrice, "CRC 0")}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-300">
                  {formatCurrency(item.ivaAmount, "CRC 0")}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-300">
                  {formatCurrency(item.subtotal, "CRC 0")}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-white">
                  {formatCurrency(item.total, "CRC 0")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
