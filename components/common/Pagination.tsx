export function Pagination({
  total,
  pages,
  currentPage,
}: {
  total: number;
  pages: number;
  currentPage: number;
}) {
  return (
    <nav
      className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
      aria-label="Pagination"
    >
      <div className="hidden sm:block">
        <p className="text-sm text-gray-700">
          Showing page <span className="font-medium">{currentPage}</span> of{" "}
          <span className="font-medium">{pages}</span> pages (
          <span className="font-medium">{total}</span> results)
        </p>
      </div>
      <div className="flex flex-1 justify-between sm:justify-end">
        <a
          href={`?page=${Math.max(1, currentPage - 1)}`}
          className={`relative inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ${
            currentPage === 1
              ? "bg-gray-100 text-gray-400 ring-gray-200"
              : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
          }`}
        >
          Previous
        </a>
        <a
          href={`?page=${Math.min(pages, currentPage + 1)}`}
          className={`relative ml-3 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ${
            currentPage === pages
              ? "bg-gray-100 text-gray-400 ring-gray-200"
              : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
          }`}
        >
          Next
        </a>
      </div>
    </nav>
  );
}
