import { useEffect, useState } from "react";
import {
  FileText,
  ImageOff,
  Minus,
  Package,
  Ruler,
  Shirt,
  ShoppingCart,
  Sparkles,
  Tag,
  X,
} from "lucide-react";

import ColorDots from "./ColorDots";
import CompositionBadges from "./CompositionBadges";
import PetCostumeNotice from "./PetCostumeNotice";
import { isPetCategoryProduct } from "./petCategoryUtils";
import { formatCurrency } from "../../utils/formatCurrency.js";

function normalizeText(value) {
  const rawValue = String(value || "");

  try {
    return decodeURIComponent(rawValue).toLowerCase();
  } catch {
    return rawValue.toLowerCase();
  }
}

function getFileUrl(file) {
  return file?.public_url || file?.url || file?.file_url || null;
}

function isImageFile(file) {
  const mimeType = normalizeText(file?.mime_type);
  const fileName = normalizeText(file?.file_name);
  const filePath = normalizeText(file?.file_path);
  const fileUrl = normalizeText(getFileUrl(file));

  return (
    mimeType.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/.test(fileName) ||
    /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/.test(filePath) ||
    /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/.test(fileUrl)
  );
}

function getGalleryImages(product) {
  const files = Array.isArray(product?.files) ? product.files : [];
  const imageFiles = files
    .filter((file) => isImageFile(file))
    .map((file) => ({
      id: file.id || file.file_path || file.file_name,
      url: getFileUrl(file),
      alt: file.file_name || "Imagen del producto",
    }))
    .filter((image) => image.url);

  const primaryImage =
    product?.main_image_url ||
    product?.cover_image_url ||
    product?.image_url ||
    null;

  if (primaryImage && !imageFiles.some((image) => image.url === primaryImage)) {
    imageFiles.unshift({
      id: "primary-image",
      url: primaryImage,
      alt: product?.product_name || product?.fabric_name || "Producto",
    });
  }

  return imageFiles;
}

function formatDimension(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return `${value} cm`;
}

function getProductPriceWithIva(product) {
  const price = Number(product?.price) || 0;
  const rawIvaAmount = product?.iva_amount;
  const ivaAmount =
    rawIvaAmount === null ||
    rawIvaAmount === undefined ||
    rawIvaAmount === ""
      ? NaN
      : Number(rawIvaAmount);

  if (Number.isFinite(ivaAmount)) {
    return price + ivaAmount;
  }

  const ivaPercentage = Number(product?.iva_percentage ?? product?.iva) || 0;
  return price + price * (ivaPercentage / 100);
}

function getVariantDimensions(variant) {
  const dimension = variant?.dimension || null;

  return [
    dimension?.heigth || dimension?.height
      ? `Alto ${formatDimension(dimension.heigth || dimension.height)}`
      : null,
    dimension?.width
      ? `Ancho ${formatDimension(dimension.width)}`
      : null,
    dimension?.lenght || dimension?.length
      ? `Largo ${formatDimension(dimension.lenght || dimension.length)}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-2 text-[11px] text-[#8AA1C6]">
        <Icon className="h-3.5 w-3.5 text-[#8AA1C6]" />
        <span>{label}</span>
      </div>
      <p className="truncate text-[0.95rem] font-bold text-white">{value}</p>
    </div>
  );
}

function QuantityControl({ value, onDecrease, onIncrease }) {
  return (
    <div className="flex h-9 items-center overflow-hidden rounded-lg border border-[#36507A] bg-[#0B1A33]">
      <button
        type="button"
        onClick={onDecrease}
        className="flex h-full w-10 items-center justify-center text-[#E3B329] transition hover:bg-[#142847]"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="flex min-w-12 items-center justify-center border-x border-[#36507A] px-3 text-sm font-bold text-white">
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        className="flex h-full w-10 items-center justify-center text-[#E3B329] transition hover:bg-[#142847]"
      >
        <span className="text-base font-semibold leading-none">+</span>
      </button>
    </div>
  );
}

function CheckboxCell({ checked, disabled, onChange }) {
  return (
    <label className={`inline-flex h-6 w-6 items-center justify-center rounded-md border ${disabled ? "border-[#334865] bg-[#0C1A31] opacity-40" : "border-[#53739D] bg-[#102340]"} cursor-${disabled ? "not-allowed" : "pointer"}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      {checked && <span className="h-3 w-3 rounded-sm bg-[#E3B329]" />}
    </label>
  );
}

export default function CatalogProductDetailsModal({
  product,
  onClose,
  onViewTechnicalSheet,
  onAddToCart,
  showPrice = false,
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addToCartError, setAddToCartError] = useState("");
  const [selectionState, setSelectionState] = useState({
    productKey: null,
    rows: {},
  });
  const shouldShowPetNotice = isPetCategoryProduct(product);

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

  const productKey = product.product_id || product.id || product.sku || "product";

  const isTextileProduct = product.catalog_type === "textile_products";
  const entityName = isTextileProduct ? "producto" : "tela";

  const productName = product.product_name || product.fabric_name || "Sin nombre";
  const productSku = product.gtin || product.sku || product.fabric_code || "Sin codigo";
  const categoryName =
    product.category?.category_name ||
    product.category_name ||
    "Sin categoria";
  const productTypeName =
    product.product_type?.product_type ||
    product.type_name ||
    "No especificado";
  const productDescription =
    product.description ||
    `Esta ${entityName} no tiene una descripcion registrada.`;

  const compositions = Array.isArray(product.compositions) ? product.compositions : [];
  const colors = Array.isArray(product.colors) ? product.colors : [];
  const features = Array.isArray(product.features) ? product.features : [];
  const managements = Array.isArray(product.managements) ? product.managements : [];
  const galleryImages = getGalleryImages(product);
  const activeImage = galleryImages[selectedImageIndex] || galleryImages[0] || null;
  const hasTechnicalSheet = Boolean(product.technical_sheet_url);

  const detailVariants = isTextileProduct
    ? (Array.isArray(product.variants) ? product.variants : []).filter(
        (variant) => variant.is_active !== false && variant.size,
      )
    : [];

  const initialSelectionRows = {};
  detailVariants.forEach((variant) => {
    initialSelectionRows[variant.variant_id] = {
      quantity: 0,
      embroidery: false,
      sublimation: false,
    };
  });

  const activeSelectionRows =
    selectionState.productKey === productKey
      ? selectionState.rows
      : initialSelectionRows;

  const totalSelected = detailVariants.reduce(
    (total, variant) => total + (activeSelectionRows[variant.variant_id]?.quantity || 0),
    0,
  );

  const handleQuantityChange = (variantId, delta) => {
    setAddToCartError("");
    setSelectionState((current) => ({
      productKey,
      rows: {
        ...(current.productKey === productKey ? current.rows : initialSelectionRows),
        [variantId]: {
          ...((current.productKey === productKey ? current.rows : initialSelectionRows)[variantId] || {}),
          quantity: Math.max(
            0,
            (((current.productKey === productKey ? current.rows : initialSelectionRows)[variantId]?.quantity) || 0) + delta,
          ),
        },
      },
    }));
  };

  const handleOptionChange = (variantId, field, value) => {
    setAddToCartError("");
    setSelectionState((current) => ({
      productKey,
      rows: {
        ...(current.productKey === productKey ? current.rows : initialSelectionRows),
        [variantId]: {
          ...((current.productKey === productKey ? current.rows : initialSelectionRows)[variantId] || {}),
          [field]: value,
        },
      },
    }));
  };

  const handleAddSelectedToCart = () => {
    if (!onAddToCart || totalSelected === 0) {
      return;
    }

    setAddToCartError("");

    for (const variant of detailVariants) {
      const selection = activeSelectionRows[variant.variant_id];
      const quantity = selection?.quantity || 0;

      if (quantity <= 0) {
        continue;
      }

      const result = onAddToCart(product, quantity, {
        variant_id: variant.variant_id,
        size_id: variant.size_id ?? variant.size?.size_id ?? null,
        size_name: variant.size?.size_name || variant.size_name || "Talla",
      }, {
        hasEmbroidery: Boolean(selection?.embroidery),
        hasSublimation: Boolean(selection?.sublimation),
      });

      if (!result?.ok) {
        setAddToCartError(
          result?.error || "No fue posible agregar la variante seleccionada al carrito.",
        );
        return;
      }
    }

    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[#020817]/86 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de ${productName}`}
    >
      <div className="flex max-h-[95vh] w-full max-w-[1380px] flex-col overflow-hidden rounded-[28px] border border-[#35547E] bg-[radial-gradient(circle_at_top,#12315d_0%,#0c1f3d_28%,#09192f_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="border-b border-[#29466F] px-6 py-4.5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-[#162742] px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#E3B329]">
                  {categoryName}
                </span>
                {productTypeName && (
                  <span className="rounded-lg bg-[#102340] px-3 py-1 text-[10px] font-medium text-[#E2EAF5]">
                    {productTypeName}
                  </span>
                )}
              </div>

              <h2 className="truncate text-[1.65rem] font-extrabold text-white">
                {productName}
              </h2>

              <p className="mt-2 max-w-3xl text-[0.92rem] leading-7 text-[#D4DCEC]">
                {productDescription}
              </p>

              {features.length > 0 && (
                <div className="mt-3.5 flex flex-wrap gap-3">
                  {features.map((feature, index) => (
                    <span
                      key={feature.id || index}
                      className="inline-flex items-center gap-2 rounded-full border border-[#38557D] bg-[#102340] px-3.5 py-1.5 text-[0.9rem] font-medium text-[#DCE6F4]"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#E3B329]" />
                      {feature.feature}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-[#8C4960] bg-[#13243F] text-[#F1B5C3] transition hover:border-[#C56881] hover:bg-[#182C4D]"
              aria-label={`Cerrar detalle de ${entityName}`}
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
            <section className="space-y-4">
              <div className="overflow-hidden rounded-3xl border border-[#35547E] bg-[#F4F1EC]">
                {activeImage ? (
                  <div className="flex aspect-[1.1/1] items-center justify-center p-3">
                    <img
                      src={activeImage.url}
                      alt={activeImage.alt}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[1.1/1] w-full flex-col items-center justify-center gap-3 text-[#667B99]">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#C9D3E1] bg-white/80">
                      <ImageOff className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium">Imagen no disponible</span>
                  </div>
                )}
              </div>

              {galleryImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {galleryImages.map((image, index) => (
                    <button
                      key={image.id || index}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border transition ${
                        selectedImageIndex === index
                          ? "border-[#E3B329] shadow-[0_0_0_2px_rgba(227,179,41,0.22)]"
                          : "border-[#35547E]"
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {!isTextileProduct && (
                <div className="space-y-4 rounded-3xl border border-[#2E466B] bg-[#0D1E38] p-4">
                  {compositions.length > 0 && (
                    <div>
                      <p className="mb-3 text-sm font-bold text-white">Composicion</p>
                      <CompositionBadges
                        compositions={compositions}
                        maxVisible={999}
                        showTitle={false}
                      />
                    </div>
                  )}

                  {colors.length > 0 && (
                    <div>
                      <p className="mb-3 text-sm font-bold text-white">Colores</p>
                      <ColorDots
                        colors={colors}
                        maxVisible={999}
                        showLabels
                      />
                    </div>
                  )}

                  {managements.length > 0 && (
                    <div>
                      <p className="mb-3 text-sm font-bold text-white">Tratamientos</p>
                      <div className="flex flex-wrap gap-2">
                        {managements.map((management, index) => (
                          <span
                            key={management.id || index}
                            className="rounded-lg border border-[#36507A] bg-[#102340] px-3 py-1.5 text-xs font-semibold text-[#DDE7F6]"
                          >
                            {management.management}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="space-y-6">
              <div className="rounded-3xl border border-[#36507A] bg-[#102340]/90 p-4.5">
                <div className="grid gap-4 md:grid-cols-3">
                  <SummaryCard icon={Package} label="Categoria" value={categoryName} />
                  <SummaryCard icon={Shirt} label="Tipo" value={productTypeName} />
                  <SummaryCard icon={Ruler} label="Unidad" value={product.unit || "cm"} />
                </div>

                {showPrice && (
                  <div className="mt-5 grid gap-4 border-t border-[#2B4469] pt-4 md:grid-cols-3">
                    <div>
                      <p className="text-[0.92rem] text-[#8AA1C6]">Precio base (sin IVA)</p>
                      <p className="mt-1 text-[1.55rem] font-extrabold text-[#E3B329]">
                        {formatCurrency(product.price || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.92rem] text-[#8AA1C6]">Monto IVA</p>
                      <p className="mt-1 text-[1.45rem] font-extrabold text-[#B9C9E3]">
                        {formatCurrency(product.iva_amount || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.92rem] text-[#8AA1C6]">Monto IVAI</p>
                      <p className="mt-1 text-[1.45rem] font-extrabold text-[#B9C9E3]">
                        {formatCurrency(getProductPriceWithIva(product))}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {isTextileProduct ? (
                <>
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-[#E3B329]" />
                      <h3 className="text-[1.15rem] font-extrabold text-white">
                        Variantes disponibles
                      </h3>
                    </div>

                    <div className="overflow-x-auto rounded-3xl border border-[#36507A] bg-[#102340]/75">
                      <table className="min-w-full text-left text-[0.9rem]">
                        <thead className="border-b border-[#2F486C] text-[#A1B5D6]">
                          <tr>
                            <th className="px-4 py-2.5 font-semibold">Talla</th>
                            <th className="px-4 py-2.5 font-semibold">GTIN</th>
                            <th className="px-4 py-2.5 font-semibold">Precio (sin IVA)</th>
                            <th className="px-4 py-2.5 font-semibold">Monto IVA</th>
                            <th className="px-4 py-2.5 font-semibold">Monto IVAI</th>
                            <th className="px-4 py-2.5 font-semibold">Dimensiones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailVariants.map((variant) => {
                            const basePrice = Number(variant.price) || 0;
                            const ivaAmount =
                              basePrice * ((Number(variant.tax_rate) || 0) / 100);

                            return (
                              <tr
                                key={variant.variant_id}
                                className="border-b border-[#2A4266] last:border-0"
                              >
                                <td className="px-4 py-3 text-[0.95rem] font-extrabold text-white">
                                  {variant.size?.size_name || "Talla"}
                                </td>
                                <td className="px-4 py-3 text-[0.88rem] text-[#D2DCEC]">
                                  {variant.gtin || "-"}
                                </td>
                                <td className="px-4 py-3 text-[0.88rem] text-[#D2DCEC]">
                                  {formatCurrency(basePrice)}
                                </td>
                                <td className="px-4 py-3 text-[0.88rem] text-[#D2DCEC]">
                                  {formatCurrency(ivaAmount)}
                                </td>
                                <td className="px-4 py-3 text-[0.88rem] text-[#D2DCEC]">
                                  {formatCurrency(basePrice + ivaAmount)}
                                </td>
                                <td className="px-4 py-3 text-[0.88rem] text-[#D2DCEC]">
                                  {getVariantDimensions(variant) || "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {onAddToCart && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-[#E3B329]" />
                        <h3 className="text-[1.15rem] font-extrabold text-white">
                          Selecciona las variantes para agregar al carrito
                        </h3>
                      </div>

                      <div className="overflow-x-auto rounded-3xl border border-[#36507A] bg-[#102340]/75">
                        <table className="min-w-full text-left text-[0.9rem]">
                          <thead className="border-b border-[#2F486C] text-[#A1B5D6]">
                            <tr>
                              <th className="px-4 py-2.5 font-semibold">Talla</th>
                              <th className="px-4 py-2.5 font-semibold">Cantidad</th>
                              <th className="px-4 py-2.5 font-semibold">Bordado</th>
                              <th className="px-4 py-2.5 font-semibold">Sublimado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detailVariants.map((variant) => {
                              const selection = activeSelectionRows[variant.variant_id] || {
                                quantity: 0,
                                embroidery: false,
                                sublimation: false,
                              };

                              return (
                                <tr
                                  key={`selection-${variant.variant_id}`}
                                  className="border-b border-[#2A4266] last:border-0"
                                >
                                  <td className="px-4 py-3 text-[0.95rem] font-extrabold text-white">
                                    {variant.size?.size_name || "Talla"}
                                  </td>
                                  <td className="px-4 py-3">
                                    <QuantityControl
                                      value={selection.quantity}
                                      onDecrease={() =>
                                        handleQuantityChange(variant.variant_id, -1)
                                      }
                                      onIncrease={() =>
                                        handleQuantityChange(variant.variant_id, 1)
                                      }
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <CheckboxCell
                                      checked={selection.embroidery}
                                      disabled={!product.embroidery}
                                      onChange={(value) =>
                                        handleOptionChange(
                                          variant.variant_id,
                                          "embroidery",
                                          value,
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <CheckboxCell
                                      checked={selection.sublimation}
                                      disabled={!product.sublimation}
                                      onChange={(value) =>
                                        handleOptionChange(
                                          variant.variant_id,
                                          "sublimation",
                                          value,
                                        )
                                      }
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {addToCartError && (
                        <p className="mt-3 rounded-2xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                          {addToCartError}
                        </p>
                      )}
                    </div>
                  )}

                  {shouldShowPetNotice && <PetCostumeNotice />}
                </>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-3xl border border-[#36507A] bg-[#102340]/75 p-5">
                    <h3 className="mb-3 text-lg font-extrabold text-white">Caracteristicas</h3>
                    {features.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {features.map((feature, index) => (
                          <span
                            key={feature.id || index}
                            className="rounded-lg border border-[#36507A] bg-[#0B1A33] px-3 py-1.5 text-xs font-semibold text-[#DCE6F4]"
                          >
                            {feature.feature}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#8AA1C6]">No hay caracteristicas registradas.</p>
                    )}
                  </div>

                  <div className="rounded-3xl border border-[#36507A] bg-[#102340]/75 p-5">
                    <h3 className="mb-3 text-lg font-extrabold text-white">Identificacion</h3>
                    <div className="space-y-2 text-sm text-[#D2DCEC]">
                      <p><span className="text-[#8AA1C6]">Codigo:</span> {productSku}</p>
                      <p><span className="text-[#8AA1C6]">Ancho:</span> {product.width || "-"}</p>
                      <p><span className="text-[#8AA1C6]">Peso:</span> {product.weight || "-"}</p>
                      <p><span className="text-[#8AA1C6]">Proveedor:</span> {product.provider || "-"}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#29466F] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            className="action-close-cancel inline-flex h-12 items-center justify-center rounded-2xl border border-[#8C4960] bg-[#13243F] px-8 text-base font-bold text-[#F0B7C2] transition hover:border-[#C56881] hover:bg-[#182C4D]"
          >
            Cerrar
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => onViewTechnicalSheet?.(product)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#36507A] bg-[#102340] px-5 text-[0.95rem] font-bold text-white transition hover:border-[#E3B329] hover:text-[#E3B329]"
            >
              <FileText className="h-3.5 w-3.5" />
              {hasTechnicalSheet ? "Ver ficha tecnica" : "Consultar ficha tecnica"}
            </button>

            {isTextileProduct && onAddToCart && (
              <button
                type="button"
                onClick={handleAddSelectedToCart}
                disabled={totalSelected === 0}
                className="inline-flex h-12 items-center justify-center gap-2.5 rounded-2xl border border-[#E3B329] bg-[#E3B329] px-6 text-[1rem] font-extrabold text-[#071426] transition hover:bg-[#F1C53B] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="h-4.5 w-4.5" />
                Agregar al carrito
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
