import {
  RiArrowLeftSLine,
  RiArrowRightSFill,
} from "react-icons/ri";

function PaginationButton({
  children,
  isActive = false,
  disabled = false,
  onClick,
  ariaLabel,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        w-7 h-7 rounded text-xs flex items-center justify-center
        transition-colors
        ${
          isActive
            ? "bg-[#C9A227] text-white"
            : "text-gray-500 hover:text-white hover:bg-[#C9A227]/15"
        }
        ${disabled ? "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-gray-500" : ""}
      `}
    >
      {children}
    </button>
  );
}

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  startItem = 0,
  endItem = 0,
  totalItems = 0,
  onPageChange,
}) {
  const pages = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange?.(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange?.(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[#2a3550]">
      <span className="text-xs text-gray-500">
        Mostrando {startItem} a {endItem} de {totalItems} agentes
      </span>

      <div className="flex items-center gap-1">
        <PaginationButton
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          ariaLabel="Página anterior"
        >
          <RiArrowLeftSLine size={14} />
        </PaginationButton>

        {pages.map((page) => (
          <PaginationButton
            key={page}
            isActive={page === currentPage}
            onClick={() => onPageChange?.(page)}
            ariaLabel={`Ir a la página ${page}`}
          >
            {page}
          </PaginationButton>
        ))}

        <PaginationButton
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          ariaLabel="Página siguiente"
        >
          <RiArrowRightSFill size={14} />
        </PaginationButton>
      </div>
    </div>
  );
}