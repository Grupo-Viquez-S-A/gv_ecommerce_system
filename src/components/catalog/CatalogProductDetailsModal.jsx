import { useEffect } from "react";
import {
  FileText,
  ImageOff,
  Package,
  Palette,
  Ruler,
  Settings,
  Tag,
  X,
} from "lucide-react";

import ColorDots from "./ColorDots";
import CompositionBadges from "./CompositionBadges";

function normalizeHexColor(value) {
  if (!value || typeof value !== "string") {
    return "#64748B";
  }

  const normalizedValue = value.trim().startsWith("#")
    ? value.trim()
    : `#${value.trim()}`;

  const isValidHex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(
    normalizedValue,
  );

  return isValidHex ? normalizedValue : "#64748B";
}

function getProductImage(product) {
  return (
    product?.main_image_url ||
    product?.cover_image_url ||
    product?.image_url ||
    null
  );
}

function DetailItem({ label, value }) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#29466F] bg-[#091A31] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#86A4CE]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function EmptyDetailMessage({ children }) {
  return (
    <p className="rounded-xl border border-dashed border-[#35547E] bg-[#091A31]/60 px-3 py-3 text-sm text-slate-500">
      {children}
    </p>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <Icon className="h-4 w-4 text-[#D7A91D]" />

      <h3 className="text-sm font-extrabold text-white">
        {children}
      </h3>
    </div>
  );
}

function formatDimension(value, unit) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return `${value}${unit ? ` ${unit}` : ""}`;
}

export default function CatalogProductDetailsModal({
  product,
  onClose,
  onViewTechnicalSheet,
}) {
  useEffect(() => {
    if (!product) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [product, onClose]);

  if (!product) {
    return null;
  }

  const isTextileProduct =
    product.catalog_type === "textile_products";

  const entityName = isTextileProduct ? "producto" : "tela";

  const productImage = getProductImage(product);

  const productName =
    product.product_name ||
    product.fabric_name ||
    "Sin nombre";

  const productSku =
    product.sku ||
    product.fabric_code ||
    "Sin código";

  const categoryName =
    product.category?.category_name ||
    product.category_name ||
    "Sin categoría";

  const productTypeName =
    product.product_type?.product_type ||
    product.type_name ||
    "No especificado";

  const productDescription =
    product.description ||
    `Esta ${entityName} no tiene una descripción registrada.`;

  const compositions = Array.isArray(product.compositions)
    ? product.compositions
    : [];

  const colors = Array.isArray(product.colors)
    ? product.colors
    : [];

  const features = Array.isArray(product.features)
    ? product.features
    : [];

  const managements = Array.isArray(product.managements)
    ? product.managements
    : [];

  const measurements = Array.isArray(product.measurements)
    ? product.measurements
    : [];

  const availableSizes = Array.isArray(product.available_sizes)
    ? product.available_sizes
    : [];

  const hasTechnicalSheet = Boolean(
    product.technical_sheet_url,
  );

  const collectionName =
    product.collection?.collection_name ||
    "Sin colección";

  const dimensionsText = [
    product.length
      ? `Largo: ${formatDimension(product.length, product.unit)}`
      : null,
    product.width
      ? `Ancho: ${formatDimension(product.width, product.unit)}`
      : null,
    product.height
      ? `Alto: ${formatDimension(product.height, product.unit)}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[#020817]/85 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de ${productName}`}
    >
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#35547E] bg-[#102441] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#29466F] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-[#D7A91D]/25 bg-[#D7A91D]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#D7A91D]">
                {categoryName}
              </span>

              {productTypeName && (
                <span className="rounded-lg border border-[#35547E] bg-[#091A31] px-2.5 py-1 text-[10px] font-semibold text-[#C9D8EC]">
                  {productTypeName}
                </span>
              )}
            </div>

            <h2 className="truncate text-xl font-extrabold text-white sm:text-2xl">
              {productName}
            </h2>

            <p className="mt-1 flex items-center gap-1.5 text-sm text-[#86A4CE]">
              <Tag className="h-3.5 w-3.5 text-[#D7A91D]" />
              {productSku}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[#45648D] bg-[#132F58] text-white transition hover:border-[#D7A91D] hover:bg-[#1B3E6B] hover:text-[#E9BC2D]"
            aria-label={`Cerrar detalle de ${entityName}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <section>
              <div className="overflow-hidden rounded-2xl border border-[#29466F] bg-[#091A31]">
                <div className="aspect-[4/3]">
                  {productImage ? (
                    <img
                      src={productImage}
                      alt={productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-500">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#35547E] bg-[#102441]">
                        <ImageOff className="h-6 w-6" />
                      </div>

                      <span className="text-sm font-medium">
                        Imagen no disponible
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {isTextileProduct ? (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <DetailItem
                    label="Colección"
                    value={collectionName}
                  />

                  <DetailItem
                    label="Unidad"
                    value={product.unit}
                  />

                  <DetailItem
                    label="Dimensiones"
                    value={dimensionsText}
                  />
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <DetailItem label="Ancho" value={product.width} />
                  <DetailItem label="Peso" value={product.weight} />
                  <DetailItem
                    label="Proveedor"
                    value={product.provider}
                  />
                  <DetailItem label="Código" value={productSku} />
                </div>
              )}
            </section>

            <section className="space-y-6">
              <div>
                <SectionTitle icon={Package}>
                  Descripción
                </SectionTitle>

                <p className="rounded-2xl border border-[#29466F] bg-[#091A31] p-4 text-sm leading-6 text-slate-300">
                  {productDescription}
                </p>
              </div>

              {isTextileProduct ? (
                <>
                  <div>
                    <SectionTitle icon={Ruler}>
                      Tallas disponibles
                    </SectionTitle>

                    {availableSizes.length > 0 ? (
                      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#29466F] bg-[#091A31] p-4">
                        {availableSizes.map((size, index) => (
                          <span
                            key={size.size_id || index}
                            className="rounded-lg border border-[#35547E] bg-[#102441] px-3 py-1.5 text-sm font-semibold text-[#C9D8EC]"
                          >
                            {size.size_name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <EmptyDetailMessage>
                        No hay tallas registradas para este producto.
                      </EmptyDetailMessage>
                    )}
                  </div>

                  <div>
                    <SectionTitle icon={Ruler}>
                      Tabla de medidas
                    </SectionTitle>

                    {measurements.length > 0 ? (
                      <div className="overflow-x-auto rounded-2xl border border-[#29466F] bg-[#091A31]">
                        <table className="min-w-full text-left text-sm">
                          <thead className="border-b border-[#29466F] bg-[#132F58] text-xs uppercase tracking-[0.12em] text-[#86A4CE]">
                            <tr>
                              <th className="px-4 py-3">Talla</th>
                              <th className="px-4 py-3">Medida</th>
                              <th className="px-4 py-3">Valor</th>
                            </tr>
                          </thead>

                          <tbody>
                            {measurements.map((measurement, index) => (
                              <tr
                                key={measurement.id || index}
                                className="border-b border-[#29466F] last:border-0"
                              >
                                <td className="px-4 py-3 font-semibold text-white">
                                  {measurement.size_name}
                                </td>

                                <td className="px-4 py-3 text-slate-300">
                                  {measurement.dimension_name}
                                </td>

                                <td className="px-4 py-3 font-semibold text-[#D7A91D]">
                                  {measurement.measurement_value}
                                  {measurement.unit
                                    ? ` ${measurement.unit}`
                                    : ""}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptyDetailMessage>
                        No hay medidas específicas registradas para este producto.
                      </EmptyDetailMessage>
                    )}
                  </div>

                  <div>
                    <SectionTitle icon={Settings}>
                      Características
                    </SectionTitle>

                    {features.length > 0 ? (
                      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#29466F] bg-[#091A31] p-4">
                        {features.map((feature, index) => (
                          <span
                            key={feature.id || index}
                            className="rounded-lg border border-[#35547E] bg-[#102441] px-2.5 py-1.5 text-xs font-semibold text-[#C9D8EC]"
                          >
                            {feature.feature}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <EmptyDetailMessage>
                        No hay características registradas.
                      </EmptyDetailMessage>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <SectionTitle icon={Ruler}>
                      Composición
                    </SectionTitle>

                    {compositions.length > 0 ? (
                      <div className="rounded-2xl border border-[#29466F] bg-[#091A31] p-4">
                        <CompositionBadges
                          compositions={compositions}
                          maxVisible={999}
                          showTitle={false}
                        />
                      </div>
                    ) : (
                      <EmptyDetailMessage>
                        No hay materiales registrados para esta tela.
                      </EmptyDetailMessage>
                    )}
                  </div>

                  <div>
                    <SectionTitle icon={Palette}>
                      Colores disponibles
                    </SectionTitle>

                    {colors.length > 0 ? (
                      <div className="rounded-2xl border border-[#29466F] bg-[#091A31] p-4">
                        <ColorDots
                          colors={colors}
                          maxVisible={999}
                          showLabels
                        />

                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {colors.map((color, index) => {
                            const colorName =
                              color.color ||
                              color.color_name ||
                              color.name ||
                              "Color disponible";

                            const quantity =
                              color.quantity !== null &&
                              color.quantity !== undefined &&
                              color.quantity !== ""
                                ? color.quantity
                                : null;

                            return (
                              <div
                                key={color.id || index}
                                className="flex items-center justify-between gap-3 rounded-xl border border-[#35547E] bg-[#102441] px-3 py-2"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <span
                                    className="h-3.5 w-3.5 flex-shrink-0 rounded-full border border-white/35"
                                    style={{
                                      backgroundColor: normalizeHexColor(
                                        color.hex_color ||
                                          color.hex ||
                                          color.hexCode,
                                      ),
                                    }}
                                  />

                                  <span className="truncate text-sm font-medium text-white">
                                    {colorName}
                                  </span>
                                </div>

                                {quantity !== null && (
                                  <span className="whitespace-nowrap text-xs font-semibold text-[#D7A91D]">
                                    {quantity} disponibles
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <EmptyDetailMessage>
                        No hay colores registrados para esta tela.
                      </EmptyDetailMessage>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div>
                      <SectionTitle icon={Settings}>
                        Características
                      </SectionTitle>

                      {features.length > 0 ? (
                        <div className="flex flex-wrap gap-2 rounded-2xl border border-[#29466F] bg-[#091A31] p-4">
                          {features.map((feature, index) => (
                            <span
                              key={feature.id || index}
                              className="rounded-lg border border-[#35547E] bg-[#102441] px-2.5 py-1.5 text-xs font-semibold text-[#C9D8EC]"
                            >
                              {feature.feature}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <EmptyDetailMessage>
                          No hay características registradas.
                        </EmptyDetailMessage>
                      )}
                    </div>

                    <div>
                      <SectionTitle icon={Settings}>
                        Tratamientos
                      </SectionTitle>

                      {managements.length > 0 ? (
                        <div className="flex flex-wrap gap-2 rounded-2xl border border-[#29466F] bg-[#091A31] p-4">
                          {managements.map((management, index) => (
                            <span
                              key={management.id || index}
                              className="rounded-lg border border-[#35547E] bg-[#102441] px-2.5 py-1.5 text-xs font-semibold text-[#C9D8EC]"
                            >
                              {management.management}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <EmptyDetailMessage>
                          No hay tratamientos registrados.
                        </EmptyDetailMessage>
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#29466F] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-slate-500">
            Información obtenida desde el catálogo comercial.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#45648D] bg-[#132F58] px-4 py-2.5 text-sm font-bold text-white transition hover:border-[#D7A91D] hover:bg-[#1B3E6B]"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={() => onViewTechnicalSheet?.(product)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D7A91D]/50 bg-[#D7A91D] px-4 py-2.5 text-sm font-bold text-[#071426] transition hover:bg-[#E9BC2D]"
            >
              <FileText className="h-4 w-4" />
              {hasTechnicalSheet
                ? "Ver ficha técnica"
                : "Consultar ficha técnica"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


