import { ArrowUpRight, ImageOff, Tag } from 'lucide-react';
import ColorDots from './ColorDots';
import CompositionBadges from './CompositionBadges';
import formatCurrency from '../../utils/formatCurrency';

function getProductImage(product) {
  const files = Array.isArray(product?.files) ? product.files : [];

  const imageFile = files.find((file) => {
    const fileType = String(file?.file_type || file?.type || '').toLowerCase();
    const mimeType = String(file?.mime_type || '').toLowerCase();

    return (
      fileType === 'image' ||
      fileType === 'imagen' ||
      mimeType.startsWith('image/')
    );
  });

  return (
    product?.main_image_url ||
    product?.cover_image_url ||
    product?.image_url ||
    imageFile?.public_url ||
    imageFile?.url ||
    imageFile?.file_url ||
    null
  );
}

function getCategoryName(product) {
  return (
    product?.category?.category_name ||
    product?.categories?.category_name ||
    product?.category_name ||
    'Sin categoría'
  );
}

function getProductTypeName(product) {
  return (
    product?.product_type?.product_type ||
    product?.product_types?.product_type ||
    product?.type?.product_type ||
    product?.type_name ||
    ''
  );
}

export default function ProductCard({
  product,
  onViewDetail,
}) {
  const productImage = getProductImage(product);

  const productName =
    product?.product_name ||
    product?.name ||
    product?.title ||
    'Producto sin nombre';

  const productSku =
    product?.sku ||
    product?.SKU ||
    product?.product_sku ||
    'SKU no disponible';

  const categoryName = getCategoryName(product);
  const productTypeName = getProductTypeName(product);

  const productDescription =
    product?.description ||
    product?.short_description ||
    'Este producto no cuenta con una descripción registrada.';

  const price =
    product?.price ??
    product?.sale_price ??
    product?.unit_price ??
    null;

  const colors =
    product?.colors ||
    product?.color_variants ||
    [];

  const compositions =
    product?.compositions ||
    product?.materials ||
    product?.product_materials ||
    [];

  const handleViewDetail = () => {
    onViewDetail?.(product);
  };

  return (
    <article
      className="
        group flex h-full flex-col overflow-hidden rounded-2xl border
        border-[#29466F] bg-[#102441]
        shadow-[0_12px_30px_rgba(0,0,0,0.14)]
        transition duration-200
        hover:-translate-y-1 hover:border-[#4B6B96]
        hover:shadow-[0_16px_36px_rgba(0,0,0,0.24)]
      "
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#091A31]">
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

      <div className="flex flex-1 flex-col p-5">
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

        <div className="mt-5 flex items-end justify-between gap-3 border-t border-[#29466F] pt-4">
          <div>
            <p className="text-xs font-medium text-slate-400">
              Precio desde
            </p>

            <p className="mt-1 text-xl font-extrabold text-[#D7A91D]">
              {formatCurrency(price)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleViewDetail}
            className="
              inline-flex items-center gap-2 rounded-xl border
              border-[#45648D] bg-[#132F58] px-3.5 py-2.5
              text-sm font-bold text-white transition
              hover:border-[#D7A91D] hover:bg-[#1B3E6B]
              hover:text-[#E9BC2D]
              active:scale-[0.98]
            "
          >
            Ver detalle
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}