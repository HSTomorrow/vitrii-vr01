import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers: (number | string)[] = [];
  const maxPagesToShow = 5;
  const halfPages = Math.floor(maxPagesToShow / 2);

  let startPage = Math.max(1, currentPage - halfPages);
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  // Adjust start page if we're near the end
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  // Add first page and ellipsis if needed
  if (startPage > 1) {
    pageNumbers.push(1);
    if (startPage > 2) {
      pageNumbers.push("...");
    }
  }

  // Add page numbers
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  // Add ellipsis and last page if needed
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pageNumbers.push("...");
    }
    pageNumbers.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-gray-200">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-gray-300 text-vitrii-text hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Página anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex gap-1">
        {pageNumbers.map((page, idx) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-2 text-vitrii-text-secondary"
              >
                {page}
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-vitrii-blue text-white"
                  : "border border-gray-300 text-vitrii-text hover:bg-gray-100"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-300 text-vitrii-text hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Próxima página"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      <div className="ml-4 text-sm text-vitrii-text-secondary">
        Página <span className="font-semibold">{currentPage}</span> de{" "}
        <span className="font-semibold">{totalPages}</span>
      </div>
    </div>
  );
}
