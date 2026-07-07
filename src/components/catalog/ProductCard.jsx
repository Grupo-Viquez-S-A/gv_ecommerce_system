import {
  ImageOff,
  Minus,
  Package,
  Plus,
  Ruler,
  ShoppingCart,
  Tag,
} from "lucide-react";
import { useState } from "react";

import ColorDots from "./ColorDots";
import CompositionBadges from "./CompositionBadges";

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

export default function ProductCard({
  product,
  onOpenProductDetails,
  onAddToCart,
}) {
  const [quantity, setQuantity] = useState(1);
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
    onAddToCart?.(product, quantity);
  };

  return (
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

        {isTextileProduct && (
          <div className="mt-5 space-y-3 border-t border-[#29466F] pt-4">
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
              Agregar al carrito
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
