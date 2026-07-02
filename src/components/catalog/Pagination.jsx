import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

function getPageItems(currentPage, totalPages) {
  /*
    Si hay pocas páginas, se muestran todas:
    1 2 3 4 5
  */
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];

  const startPage = Math.max(2, currentPage - 1);
  const endPage = Math.min(totalPages - 1, currentPage + 1);

  if (startPage > 2) {
    pages.push('ellipsis-left');
  }

  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }

  if (endPage < totalPages - 1) {
    pages.push('ellipsis-right');
  }

  pages.push(totalPages);

  return pages;
}

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safeCurrentPage = Math.min(
    Math.max(1, Number(currentPage) || 1),
    safeTotalPages
  );

  /*
    Si todos los productos caben en una sola página,
    no se muestra la paginación.
  */
  if (safeTotalPages <= 1) {
    return null;
  }

  const pageItems = getPageItems(safeCurrentPage, safeTotalPages);

  const goToPage = (page) => {
    if (
      typeof page !== 'number' ||
      page < 1 ||
      page > safeTotalPages ||
      page === safeCurrentPage
    ) {
      return;
    }

    onPageChange?.(page);
  };

  return (
    <nav
      aria-label="Paginación del catálogo"
      className="
        mt-8 flex flex-col gap-4 rounded-2xl border border-[#29466F]
        bg-[#102441] px-4 py-4 sm:flex-row sm:items-center
        sm:justify-between sm:px-5
      "
    >
      <p className="text-center text-sm text-slate-400 sm:text-left">
        Página{' '}
        <span className="font-bold text-white">
          {safeCurrentPage}
        </span>{' '}
        de{' '}
        <span className="font-bold text-white">
          {safeTotalPages}
        </span>
      </p>

      <div className="flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => goToPage(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          aria-label="Página anterior"
          className="
            inline-flex h-10 w-10 items-center justify-center rounded-xl
            border border-[#45648D] bg-[#132F58] text-white transition
            hover:border-[#D7A91D] hover:bg-[#1B3E6B]
            hover:text-[#E9BC2D]
            disabled:cursor-not-allowed disabled:opacity-40
            disabled:hover:border-[#45648D]
            disabled:hover:bg-[#132F58]
            disabled:hover:text-white
          "
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pageItems.map((item) => {
          if (typeof item === 'string') {
            return (
              <span
                key={item}
                className="
                  inline-flex h-10 w-8 items-center justify-center
                  text-[#86A4CE]
                "
                aria-hidden="true"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            );
          }

          const isCurrentPage = item === safeCurrentPage;

          return (
            <button
              key={item}
              type="button"
              onClick={() => goToPage(item)}
              aria-label={`Ir a la página ${item}`}
              aria-current={isCurrentPage ? 'page' : undefined}
              className={`
                inline-flex h-10 min-w-10 items-center justify-center
                rounded-xl border px-3 text-sm font-bold transition
                ${
                  isCurrentPage
                    ? 'border-[#D7A91D] bg-[#D7A91D] text-[#071426] shadow-[0_6px_16px_rgba(215,169,29,0.18)]'
                    : 'border-[#45648D] bg-[#132F58] text-white hover:border-[#D7A91D] hover:bg-[#1B3E6B] hover:text-[#E9BC2D]'
                }
              `}
            >
              {item}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => goToPage(safeCurrentPage + 1)}
          disabled={safeCurrentPage === safeTotalPages}
          aria-label="Página siguiente"
          className="
            inline-flex h-10 w-10 items-center justify-center rounded-xl
            border border-[#45648D] bg-[#132F58] text-white transition
            hover:border-[#D7A91D] hover:bg-[#1B3E6B]
            hover:text-[#E9BC2D]
            disabled:cursor-not-allowed disabled:opacity-40
            disabled:hover:border-[#45648D]
            disabled:hover:bg-[#132F58]
            disabled:hover:text-white
          "
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}