import {
  Check,
  ImageOff,
  Minus,
  Package,
  Plus,
  Ruler,
  ShoppingCart,
  Tag,
  X,
} from "lucide-react";
import { useState } from "react";

import ColorDots from "./ColorDots";
import CompositionBadges from "./CompositionBadges";
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
  return (
    file?.public_url ||
    file?.url ||
    file?.file_url ||
    null
  );
}

function isTechnicalSheetFile(file) {
  const fileText = normalizeText(
    [
      file?.file_type,
      file?.type,
      file?.file_name,
      file?.file_path,
      getFileUrl(file),
      file?.mime_type,
    ]
      .filter(Boolean)
      .join(" "),
  );

  return (
    fileText.includes("ficha") ||
    fileText.includes("technical") ||
    fileText.includes("datasheet") ||
    fileText.includes("especificacion") ||
    fileText.includes("specification")
  );
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

function getProductImage(product) {
  const files = Array.isArray(product?.files)
    ? product.files
    : [];

  const directImage =
    product?.main_image_url ||
    product?.cover_image_url ||
    product?.image_url ||
    null;

  if (
    directImage &&
    !normalizeText(directImage).includes("ficha") &&
    !normalizeText(directImage).includes("technical")
  ) {
    return directImage;
  }

  const catalogImage = files.find((file) => {
    return isImageFile(file) && !isTechnicalSheetFile(file);
  });

  return getFileUrl(catalogImage);
}

function getCategoryName(product) {
  return (
    product?.category?.category_name ||
    product?.categories?.category_name ||
    product?.category_name ||
    "Sin categoría"
  );
}

function getProductTypeName(product) {
  return (
    product?.product_type?.product_type ||
    product?.product_types?.product_type ||
    product?.type?.product_type ||
    product?.type_name ||
    ""
  );
}

function getCollectionName(product) {
  return (
    product?.collection?.collection_name ||
    product?.collection_name ||
    "Sin colección"
  );
}

function SizePickerModal({ productName, availableSizes, onConfirm, onCancel }) {
  const [sizeQuantities, setSizeQuantities] = useState(() => {
    const initial = {};
    availableSizes.forEach((s) => {
      initial[s.size_id ?? s.size_name] = 0;
    });
    return initial;
  });

  const adjustQty = (key, delta) => {
    setSizeQuantities((prev) => ({
      ...prev,
      [key]: Math.max(0, (prev[key] || 0) + delta),
    }));
  };

  const totalSelected = Object.values(sizeQuantities).reduce(
    (acc, q) => acc + q,
    0,
  );

  const handleConfirm = () => {
    const selections = availableSizes
      .map((size) => ({
        size,
        quantity: sizeQuantities[size.size_id ?? size.size_name] || 0,
      }))
      .filter((s) => s.quantity > 0);

    onConfirm(selections);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-sm rounded-2xl border border-[#35547E] bg-[#0D1F38] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#29466F] p-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
              Selecciona las tallas
            </p>
            <p className="mt-0.5 truncate text-sm font-extrabold text-white">
              {productName}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 p-5">
          {availableSizes.map((size) => {
            const key = size.size_id ?? size.size_name;
            const qty = sizeQuantities[key] || 0;

            return (
              <div
                key={key}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
                  qty > 0
                    ? "border-[#D7A91D] bg-[#D7A91D]/10"
                    : "border-[#35547E] bg-[#091A31]"
                }`}
              >
                <span className="text-sm font-semibold text-white">
                  {size.size_name}
                </span>

                <div className="flex items-center overflow-hidden rounded-lg border border-[#35547E] bg-[#102441]">
                  <button
                    type="button"
                    onClick={() => adjustQty(key, -1)}
                    className="flex h-8 w-8 items-center justify-center text-[#C9D8EC] transition hover:bg-[#132F58] hover:text-[#E9BC2D]"
                    aria-label={`Restar ${size.size_name}`}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>

                  <span className="min-w-8 border-x border-[#35547E] text-center text-sm font-bold text-white leading-8">
                    {qty}
                  </span>

                  <button
                    type="button"
                    onClick={() => adjustQty(key, 1)}
                    className="flex h-8 w-8 items-center justify-center text-[#C9D8EC] transition hover:bg-[#132F58] hover:text-[#E9BC2D]"
                    aria-label={`Sumar ${size.size_name}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 border-t border-[#29466F] p-4">
          <button
            type="button"
            onClick={onCancel}
            className="action-close-cancel flex-1 rounded-xl border border-[#35547E] px-4 py-2.5 text-sm font-semibold text-[#9BB3D3] transition hover:border-[#5a8abf] hover:text-white"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={totalSelected === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#45648D] bg-[#132F58] px-4 py-2.5 text-sm font-bold text-white transition hover:border-[#D7A91D] hover:bg-[#1B3E6B] hover:text-[#E9BC2D] disabled:pointer-events-none disabled:opacity-40"
          >
            <Check className="h-4 w-4" />
            Agregar ({totalSelected})
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductCard({
  product,
  onOpenProductDetails,
  onAddToCart,
  canPurchase = true,
}) {
  const [quantity, setQuantity] = useState(1);
  const [hasSublimation, setHasSublimation] = useState(false);
  const [hasEmbroidery, setHasEmbroidery] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const productImage = getProductImage(product);

  const isTextileProduct =
    product?.catalog_type === "textile_products";

  const productName =
    product?.product_name ||
    product?.name ||
    product?.title ||
    "Producto sin nombre";

  const productSku =
    product?.sku ||
    product?.SKU ||
    product?.product_sku ||
    "SKU no disponible";

  const categoryName = getCategoryName(product);
  const productTypeName = getProductTypeName(product);

  const productDescription =
    product?.description ||
    product?.short_description ||
    "Este producto no cuenta con una descripción registrada.";

  const colors =
    product?.colors ||
    product?.color_variants ||
    [];

  const compositions =
    product?.compositions ||
    product?.materials ||
    product?.product_materials ||
    [];

  const availableSizes = Array.isArray(product?.available_sizes)
    ? product.available_sizes
    : [];

  const features = Array.isArray(product?.features)
    ? product.features
    : [];

  const hasMultipleSizes = availableSizes.length > 1;
  const canUseSublimation = Boolean(product?.sublimation);
  const canUseEmbroidery = Boolean(product?.embroidery);
  const customizationOptions = {
    hasSublimation: canUseSublimation && hasSublimation,
    hasEmbroidery: canUseEmbroidery && hasEmbroidery,
  };

  const handleOpenProductDetails = () => {
    onOpenProductDetails?.(product);
  };

  const decreaseQuantity = () => {
    setQuantity((currentQuantity) =>
      Math.max(1, currentQuantity - 1),
    );
  };

  const increaseQuantity = () => {
    setQuantity((currentQuantity) => currentQuantity + 1);
  };

  const handleQuantityChange = (event) => {
    const nextQuantity = Number.parseInt(event.target.value, 10);

    setQuantity(
      Number.isNaN(nextQuantity) ? 1 : Math.max(1, nextQuantity),
    );
  };

  const handleAddToCart = () => {
    if (hasMultipleSizes) {
      setShowSizePicker(true);
    } else {
      onAddToCart?.(product, quantity, availableSizes[0] ?? null, customizationOptions);
    }
  };

  const handleSizePickerConfirm = (selections) => {
    selections.forEach(({ size, quantity: qty }) => {
      onAddToCart?.(product, qty, size, customizationOptions);
    });
    setShowSizePicker(false);
  };

  return (
    <>
      <article
        className="
          group relative flex h-full flex-col overflow-hidden rounded-2xl border
          border-[#29466F] bg-[#102441]
          shadow-[0_12px_30px_rgba(0,0,0,0.14)]
          transition duration-200
          hover:-translate-y-1 hover:border-[#4B6B96]
          hover:shadow-[0_16px_36px_rgba(0,0,0,0.24)]
        "
      >
        <button
          type="button"
          onClick={handleOpenProductDetails}
          className="absolute inset-0 z-0 cursor-pointer"
          aria-label={`Ver información completa de ${productName}`}
        />

        <div className="relative z-10 pointer-events-none aspect-[4/3] overflow-hidden bg-[#091A31]">
          {productImage ? (
            <img
              src={productImage}
              alt={productName}
              className="
                h-full w-full object-cover transition duration-500
                group-hover:scale-105
              "
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#29466F] bg-[#102441]">
                <ImageOff className="h-5 w-5" />
              </div>

              <span className="text-xs font-medium">
                Imagen no disponible
              </span>
            </div>
          )}

          <div className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2">
            <span
              className="
                max-w-full truncate rounded-lg border border-white/10
                bg-[#071426]/90 px-2.5 py-1 text-[10px] font-bold
                uppercase tracking-[0.12em] text-[#D7A91D]
                backdrop-blur-sm
              "
            >
              {categoryName}
            </span>

            {productTypeName && (
              <span
                className="
                  max-w-full truncate rounded-lg border border-white/10
                  bg-[#071426]/90 px-2.5 py-1 text-[10px] font-semibold
                  text-[#C9D8EC] backdrop-blur-sm
                "
              >
                {productTypeName}
              </span>
            )}
          </div>
        </div>

        <div className="relative z-10 pointer-events-none flex flex-1 flex-col p-5">
          <div className="mb-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs text-[#86A4CE]">
              <Tag className="h-3.5 w-3.5 text-[#D7A91D]" />
              <span className="truncate">{productSku}</span>
            </div>

            <h3 className="text-lg font-extrabold leading-snug text-white">
              {productName}
            </h3>

            <p className="mt-2 h-10 overflow-hidden text-sm leading-5 text-slate-400">
              {productDescription}
            </p>

            {isTextileProduct && canPurchase && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#D7A91D]/25 bg-[#D7A91D]/10 px-3 py-2.5">
                <span className="text-xs font-bold uppercase tracking-[0.13em] text-[#86A4CE]">
                  Precio
                </span>
                <span className="text-base font-extrabold text-[#E9BC2D]">
                  {formatCurrency(product.price)}
                </span>
              </div>
            )}
          </div>

          {isTextileProduct ? (
            <div className="space-y-4 border-t border-[#29466F] pt-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.13em] text-[#86A4CE]">
                  Colección
                </p>

                <p className="flex items-center gap-2 text-sm font-semibold text-[#C9D8EC]">
                  <Package className="h-4 w-4 text-[#D7A91D]" />
                  {getCollectionName(product)}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-[#86A4CE]">
                  Tallas disponibles
                </p>

                {availableSizes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.slice(0, 4).map((size, index) => (
                      <span
                        key={size.size_id || index}
                        className="rounded-lg border border-[#35547E] bg-[#091A31] px-2.5 py-1 text-xs font-semibold text-[#C9D8EC]"
                      >
                        {size.size_name}
                      </span>
                    ))}

                    {availableSizes.length > 4 && (
                      <span className="rounded-lg border border-[#35547E] bg-[#132F58] px-2.5 py-1 text-xs font-bold text-[#D7A91D]">
                        +{availableSizes.length - 4}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Sin tallas registradas
                  </p>
                )}
              </div>

              {features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {features.slice(0, 2).map((feature, index) => (
                    <span
                      key={feature.id || index}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#35547E] bg-[#091A31] px-2.5 py-1 text-xs font-semibold text-[#C9D8EC]"
                    >
                      <Ruler className="h-3 w-3 text-[#D7A91D]" />
                      {feature.feature}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 border-t border-[#29466F] pt-4">
              <CompositionBadges
                compositions={compositions}
                maxVisible={2}
                showTitle={false}
              />

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-[#86A4CE]">
                  Colores disponibles
                </p>

                <ColorDots
                  colors={colors}
                  maxVisible={4}
                  showLabels={false}
                />
              </div>
            </div>
          )}

          {isTextileProduct && canPurchase && (
            <div className="mt-5 space-y-3 border-t border-[#29466F] pt-4">
              {!hasMultipleSizes && (
                <div className="pointer-events-auto relative z-20 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.13em] text-[#86A4CE]">
                    Cantidad
                  </span>

                  <div className="flex items-center overflow-hidden rounded-xl border border-[#35547E] bg-[#091A31]">
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      className="flex h-10 w-10 items-center justify-center text-[#C9D8EC] transition hover:bg-[#132F58] hover:text-[#E9BC2D]"
                      aria-label={`Restar cantidad de ${productName}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>

                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="h-10 w-14 border-x border-[#35547E] bg-[#091A31] text-center text-sm font-bold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      aria-label={`Cantidad de ${productName}`}
                    />

                    <button
                      type="button"
                      onClick={increaseQuantity}
                      className="flex h-10 w-10 items-center justify-center text-[#C9D8EC] transition hover:bg-[#132F58] hover:text-[#E9BC2D]"
                      aria-label={`Sumar cantidad de ${productName}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {canPurchase && (canUseSublimation || canUseEmbroidery) && (
                <div className="pointer-events-auto relative z-20 grid gap-2 rounded-xl border border-[#29466F] bg-[#091A31]/70 p-3">
                  {canUseSublimation && (
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#C9D8EC]">
                      <input
                        type="checkbox"
                        checked={hasSublimation}
                        onChange={(event) => setHasSublimation(event.target.checked)}
                        className="h-4 w-4 accent-[#D7A91D]"
                      />
                      Requiere sublimación
                    </label>
                  )}

                  {canUseEmbroidery && (
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#C9D8EC]">
                      <input
                        type="checkbox"
                        checked={hasEmbroidery}
                        onChange={(event) => setHasEmbroidery(event.target.checked)}
                        className="h-4 w-4 accent-[#D7A91D]"
                      />
                      Requiere bordado
                    </label>
                  )}
                </div>
              )}

              {canPurchase && (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="
                    pointer-events-auto relative z-20 inline-flex w-full items-center justify-center gap-2
                    rounded-xl border border-[#45648D] bg-[#132F58]
                    px-3.5 py-2.5 text-sm font-bold text-white transition
                    hover:border-[#D7A91D] hover:bg-[#1B3E6B]
                    hover:text-[#E9BC2D] active:scale-[0.98]
                  "
                >
                  <ShoppingCart className="h-4 w-4" />
                  {hasMultipleSizes ? "Agregar al carrito..." : "Agregar al carrito"}
                </button>
              )}
            </div>
          )}
        </div>
      </article>

      {showSizePicker && (
        <SizePickerModal
          productName={productName}
          availableSizes={availableSizes}
          onConfirm={handleSizePickerConfirm}
          onCancel={() => setShowSizePicker(false)}
        />
      )}
    </>
  );
}
