import { ImageOff } from "lucide-react";
import { useMemo, useState } from "react";

import ColorDots from "../catalog/ColorDots";
import CompositionBadges from "../catalog/CompositionBadges";
import {
  getOptimizedSupabaseImageUrl,
  isChromiumLikeBrowser,
} from "../../utils/supabaseImageUrl.js";

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
  const files = Array.isArray(product?.files) ? product.files : [];

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
    "Sin categoria"
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

function renderSizeItems(availableSizes) {
  if (availableSizes.length === 0) {
    return (
      <p className="text-xs text-[#7F97BE]">
        Sin tallas registradas
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableSizes.slice(0, 6).map((size, index) => (
        <span
          key={size.variant_id || size.size_id || index}
          className="rounded-lg border border-[#324A70] bg-[#0A1A33] px-3 py-1.5 text-xs font-medium text-[#D7E1F0]"
        >
          {size.size_name}
        </span>
      ))}
    </div>
  );
}

export default function ClientProductCard({
  product,
  showPrice = false,
  onOpenProductDetails,
}) {
  const originalProductImage = getProductImage(product);
  const optimizedProductImage = useMemo(
    () =>
      getOptimizedSupabaseImageUrl(originalProductImage, {
        width: 960,
        height: 720,
        quality: 84,
      }),
    [originalProductImage],
  );
  const [failedImages, setFailedImages] = useState({
    optimized: null,
    original: null,
  });
  const optimizedImageFailed =
    failedImages.optimized === optimizedProductImage;
  const originalImageFailed =
    failedImages.original === originalProductImage;
  const productImage = optimizedImageFailed
    ? isChromiumLikeBrowser() || originalImageFailed
      ? null
      : originalProductImage
    : optimizedProductImage;

  const isTextileProduct = product?.catalog_type === "textile_products";

  const productName =
    product?.product_name ||
    product?.name ||
    product?.title ||
    "Producto sin nombre";

  const productCode = product?.gtin || "Sin código";

  const categoryName = getCategoryName(product);
  const productTypeName = getProductTypeName(product);

  const productDescription =
    product?.description ||
    product?.short_description ||
    "Este producto no cuenta con una descripcion registrada.";

  const colors = product?.colors || product?.color_variants || [];
  const compositions =
    product?.compositions ||
    product?.materials ||
    product?.product_materials ||
    [];
  const availableSizes = Array.isArray(product?.available_sizes)
    ? product.available_sizes
    : [];

  const handleOpenProductDetails = () => {
    onOpenProductDetails?.(product);
  };

  return (
    <article
      className="
        catalog-product-card group flex h-full flex-col overflow-hidden rounded-[22px] border
        border-[#31486C] bg-[#0B1931]
        shadow-[0_16px_34px_rgba(0,0,0,0.20)]
        transition duration-200
        hover:-translate-y-1 hover:border-[#4C6A95]
        hover:shadow-[0_22px_40px_rgba(0,0,0,0.28)]
      "
    >
      <button
        type="button"
        onClick={handleOpenProductDetails}
        className="catalog-product-media relative block aspect-[1.08/1] w-full overflow-hidden bg-[#F4F2ED] text-left"
        aria-label={`Ver informacion completa de ${productName}`}
      >
        {productImage ? (
          <img
            src={productImage}
            alt={productName}
            className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
            onError={() => {
              setFailedImages((current) =>
                productImage === optimizedProductImage
                  ? { ...current, optimized: optimizedProductImage }
                  : { ...current, original: originalProductImage },
              );
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-[#6E7F9A]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D5DCE7] bg-white/80">
              <ImageOff className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium">Imagen no disponible</span>
          </div>
        )}

        <div className="absolute left-4 top-4 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
          <span className="rounded-lg bg-[#0A1830] px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#E3B329]">
            {categoryName}
          </span>

          {productTypeName && (
            <span className="rounded-lg bg-[#152846] px-3 py-1 text-[11px] font-medium text-[#E1E8F3]">
              {productTypeName}
            </span>
          )}
        </div>
      </button>

      <div className="flex flex-1 flex-col bg-[#0B1931] px-5 pb-5 pt-4">
        <button
          type="button"
          onClick={handleOpenProductDetails}
          className="block w-full text-left text-[1.05rem] font-extrabold leading-snug text-white transition hover:text-[#E9BC2D]"
        >
          {productName}
        </button>

        <p className="mt-2 text-sm font-medium text-[#8EA4C9]">
          {productCode}
        </p>

        <p className="mt-4 min-h-[84px] text-[0.95rem] leading-8 text-[#C9D4E5] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
          {productDescription}
        </p>

        {showPrice && (
          <p className="mt-3 text-sm font-semibold text-[#E3B329]">
            Consulta el precio en el detalle del producto.
          </p>
        )}

        <div className="mt-5 border-t border-[#263A5C] pt-5">
          {isTextileProduct ? (
            <div>
              <p className="mb-3 text-sm font-bold text-white">
                Tallas disponibles
              </p>
              {renderSizeItems(availableSizes)}
            </div>
          ) : (
            <div className="space-y-4">
              <CompositionBadges
                compositions={compositions}
                maxVisible={2}
                showTitle={false}
              />

              <div>
                <p className="mb-3 text-sm font-bold text-white">
                  Colores disponibles
                </p>
                <ColorDots
                  colors={colors}
                  maxVisible={5}
                  showLabels={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
