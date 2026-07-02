import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from "react-icons/ri";

export default function ClientsPagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  startItem = 0,
  endItem = 0,
  onPageChange,
}) {
  const safeTotalPages = Math.max(totalPages, 1);
  const hasItems = totalItems > 0;

  const goToPage = (page) => {
    if (!hasItems || page < 1 || page > safeTotalPages || page === currentPage) {
      return;
    }

    onPageChange(page);
  };

  const getVisiblePages = () => {
    const pages = [];

    if (safeTotalPages <= 5) {
      for (let page = 1; page <= safeTotalPages; page += 1) {
        pages.push(page);
      }

      return pages;
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push("left-ellipsis");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(safeTotalPages - 1, currentPage + 1);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    if (currentPage < safeTotalPages - 2) {
      pages.push("right-ellipsis");
    }

    pages.push(safeTotalPages);

    return pages;
  };

  const visiblePages = getVisiblePages();

  const buttonBaseClasses =
    "w-7 h-7 rounded flex items-center justify-center text-xs transition-colors";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-3 border-t border-[#2a3550]">
      <span className="text-xs text-gray-500">
        {hasItems
          ? `Mostrando ${startItem} a ${endItem} de ${totalItems} clientes`
          : "No hay clientes para mostrar"}
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={!hasItems || currentPage === 1}
          aria-label="Página anterior"
          className={`${buttonBaseClasses} text-gray-500 hover:text-white hover:bg-[#C9A227]/15 disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <RiArrowLeftSLine size={15} />
        </button>

        {visiblePages.map((page) => {
          if (typeof page === "string") {
            return (
              <span
                key={page}
                className="w-7 h-7 flex items-center justify-center text-xs text-gray-500"
              >
                ...
              </span>
            );
          }

          const isActive = page === currentPage;

          return (
            <button
              key={page}
              type="button"
              onClick={() => goToPage(page)}
              aria-label={`Ir a la página ${page}`}
              aria-current={isActive ? "page" : undefined}
              className={`${buttonBaseClasses} ${
                isActive
                  ? "bg-[#C9A227] text-white"
                  : "text-gray-500 hover:text-white hover:bg-[#C9A227]/15"
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={!hasItems || currentPage === safeTotalPages}
          aria-label="Página siguiente"
          className={`${buttonBaseClasses} text-gray-500 hover:text-white hover:bg-[#C9A227]/15 disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <RiArrowRightSLine size={15} />
        </button>
      </div>
    </div>
  );
}