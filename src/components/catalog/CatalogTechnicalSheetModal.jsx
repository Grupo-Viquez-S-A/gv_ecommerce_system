import { useEffect } from "react";
import {
  ExternalLink,
  FileImage,
  ImageOff,
  X,
} from "lucide-react";

function isImageUrl(url, mimeType = "") {
  const normalizedMimeType = String(mimeType || "").toLowerCase();
  const normalizedUrl = String(url || "").toLowerCase();

  return (
    normalizedMimeType.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/.test(normalizedUrl)
  );
}

export default function CatalogTechnicalSheetModal({
  product,
  onClose,
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

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [product, onClose]);

  if (!product) {
    return null;
  }

  const technicalSheetUrl = product.technical_sheet_url || null;
  const technicalSheetFile = product.technical_sheet_file || null;

  const productName =
    product.product_name ||
    product.fabric_name ||
    "Producto";

  const hasTechnicalSheet = Boolean(technicalSheetUrl);
  const technicalSheetIsImage = isImageUrl(
    technicalSheetUrl,
    technicalSheetFile?.mime_type,
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020817]/85 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Ficha técnica de ${productName}`}
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#35547E] bg-[#102441] shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-[#29466F] px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#D7A91D]">
              Ficha técnica
            </p>

            <h2 className="mt-1 truncate text-lg font-extrabold text-white sm:text-xl">
              {productName}
            </h2>

            {product.sku && (
              <p className="mt-1 text-sm text-slate-400">
                Código: {product.sku}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[#45648D] bg-[#132F58] text-white transition hover:border-[#D7A91D] hover:bg-[#1B3E6B] hover:text-[#E9BC2D]"
            aria-label="Cerrar ficha técnica"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#091A31] p-4 sm:p-6">
          {hasTechnicalSheet && technicalSheetIsImage ? (
            <img
              src={technicalSheetUrl}
              alt={`Ficha técnica de ${productName}`}
              className="mx-auto max-h-[72vh] w-auto max-w-full rounded-lg object-contain shadow-xl"
            />
          ) : hasTechnicalSheet ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#35547E] bg-[#102441]">
                <FileImage className="h-8 w-8 text-[#D7A91D]" />
              </div>

              <h3 className="mt-5 text-xl font-extrabold text-white">
                Ficha técnica disponible
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                Este archivo no es una imagen, pero puedes abrirlo en una
                nueva pestaña.
              </p>

              <a
                href={technicalSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#45648D] bg-[#132F58] px-4 py-2.5 text-sm font-bold text-white transition hover:border-[#D7A91D] hover:bg-[#1B3E6B] hover:text-[#E9BC2D]"
              >
                Abrir ficha técnica
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#35547E] bg-[#102441]">
                <ImageOff className="h-8 w-8 text-[#D7A91D]" />
              </div>

              <h3 className="mt-5 text-xl font-extrabold text-white">
                Ficha técnica no disponible
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                Este elemento no tiene una ficha técnica.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end border-t border-[#29466F] px-5 py-4">
          {hasTechnicalSheet && (
            <a
              href={technicalSheetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#D7A91D] transition hover:text-[#E9BC2D]"
            >
              Abrir en otra pestaña
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}