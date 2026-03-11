import { useGetLostItemsQuery } from "../../redux/api/api";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useState, useRef } from "react";
import type { lostItem } from "../../types/types";

const LostItemsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [fuzzyTerm, setFuzzyTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("lostItemName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [limit] = useState(12);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: lostItems, isLoading } = useGetLostItemsQuery({
    searchTerm,
    page: currentPage,
    limit,
    sortBy,
    sortOrder,
  });

  const handleFuzzyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFuzzyTerm(value);
    // Debounce: send to API after 400ms pause so it fires on every keystroke
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 400);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [field, order] = e.target.value.split("-");
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const clearSearch = () => {
    setFuzzyTerm("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const totalPages = lostItems?.meta?.totalPage || 1;

  if (isLoading)
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="py-8 px-6 sm:px-10 lg:px-16 mx-auto">
          <div className="mx-auto text-center lg:mb-8 mb-6">
            <div className="h-8 bg-gray-800 rounded-lg w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-800 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 mb-8 border border-gray-800">
            <div className="h-12 bg-gray-800 rounded-xl mb-6 animate-pulse"></div>
            <div className="flex gap-4">
              <div className="h-10 bg-gray-800 rounded-lg flex-1 animate-pulse"></div>
            </div>
          </div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 animate-pulse">
                <div className="h-52 bg-gray-800"></div>
                <div className="p-5">
                  <div className="h-5 bg-gray-800 rounded mb-3"></div>
                  <div className="h-4 bg-gray-800 rounded mb-2"></div>
                  <div className="h-4 bg-gray-800 rounded w-3/4 mb-4"></div>
                  <div className="h-9 bg-gray-800 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 pb-16">
      <div className="py-8 px-6 sm:px-10 lg:px-16 mx-auto">

        {/* Header */}
        <div className="mx-auto text-center lg:mb-8 mb-6">
          <h2 className="mb-4 text-3xl lg:text-4xl tracking-tight font-extrabold text-white">
            All Lost Items
          </h2>
          <p className="font-light text-gray-500 sm:text-lg">
            Help reunite people with their lost belongings
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-8 border border-gray-800">

          {/* Fuzzy Search Input */}
          <div className="mb-5">
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                <FaSearch className="text-gray-500" size={13} />
              </div>
              <input
                type="search"
                className="block w-full p-3.5 ps-11 text-sm text-white border border-gray-700 rounded-xl bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 transition-all duration-200"
                placeholder="Search by name, location, or description..."
                value={fuzzyTerm}
                onChange={handleFuzzyInputChange}
              />
              {fuzzyTerm ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="text-white absolute end-2.5 bottom-2 bg-gray-600 hover:bg-gray-500 font-medium rounded-lg text-sm px-3 py-1.5 transition-all duration-200"
                >
                  ✕ Clear
                </button>
              ) : null}
            </div>
            {fuzzyTerm && (
              <p className="text-xs text-gray-500 mt-2 ps-1">
                Showing results for{" "}
                <span className="text-blue-400 font-medium">"{fuzzyTerm}"</span>
                {" "}— results update as you type
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <FaFilter className="text-gray-500" size={13} />
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={handleSortChange}
                className="block w-full sm:w-56 p-2.5 text-sm text-white border border-gray-700 rounded-lg bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="lostItemName-asc">Name (A-Z)</option>
                <option value="lostItemName-desc">Name (Z-A)</option>
                <option value="date-desc">Date (Newest First)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="location-asc">Location (A-Z)</option>
                <option value="location-desc">Location (Z-A)</option>
              </select>
            </div>
            {fuzzyTerm && (
              <button
                onClick={clearSearch}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium bg-blue-900/20 px-4 py-2 rounded-lg hover:bg-blue-900/30 transition-all duration-200 border border-blue-600/30"
              >
                Clear search
              </button>
            )}
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6">
          <p className="text-center text-sm text-gray-500">
            {fuzzyTerm
              ? `Search results for "${fuzzyTerm}" — ${lostItems?.data?.length || 0} items found`
              : `Showing ${lostItems?.data?.length || 0} lost items`}
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="px-6 sm:px-10 lg:px-16">
        {lostItems?.data?.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-900 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center border border-gray-800">
              <FaSearch className="text-gray-600 text-2xl" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {fuzzyTerm ? "No items found" : "No lost items yet"}
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              {fuzzyTerm
                ? `No items found for "${fuzzyTerm}". Try different keywords — the search matches names, descriptions, and locations.`
                : "No lost items have been reported yet. Check back later!"}
            </p>
            {fuzzyTerm && (
              <button
                onClick={clearSearch}
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all duration-200"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {lostItems?.data?.map((lostItem: lostItem) => (
              <div
                key={`${lostItem?.id}127`}
                className="group relative bg-gray-900 rounded-xl overflow-hidden transition-all duration-300 border border-gray-800 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-900/20 flex flex-col"
              >
                <div className="relative overflow-hidden">
                  <div className="h-52 w-full overflow-hidden">
                    <img
                      src={lostItem?.img}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      alt={lostItem?.lostItemName}
                      width={500}
                      height={500}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/bgimg.png";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                  {lostItem?.isFound ? (
                    <div className="absolute top-3 right-3 bg-green-600/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-green-500/40">
                      ✓ Found
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 bg-red-600/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-red-500/40">
                      Lost
                    </div>
                  )}
                </div>

                <div className="p-5 text-white flex flex-col flex-1">
                  <h3 className="text-base font-bold mb-2 text-white group-hover:text-blue-400 transition-colors duration-200 line-clamp-1">
                    {lostItem?.lostItemName}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {lostItem?.description}
                  </p>
                  <div className="space-y-1.5 mt-auto mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>📅</span>
                      <span>{lostItem?.date.split("T")[0]}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>📍</span>
                      <span className="line-clamp-1">{lostItem.location}</span>
                    </div>
                  </div>
                  <Link to={`/lostItems/${lostItem?.id}`} className="block">
                    <button className="w-full bg-blue-600/20 hover:bg-blue-600 border border-blue-600/40 hover:border-blue-600 text-blue-300 hover:text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200">
                      View Details
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center mt-12 pb-8 space-y-4">
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages} ({lostItems?.meta?.total || 0} total items)
          </div>
          <nav className="inline-flex items-center space-x-1 bg-gray-900 rounded-2xl p-2 border border-gray-800">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                currentPage === 1
                  ? "text-gray-600 cursor-not-allowed"
                  : "text-gray-300 bg-gray-800 hover:bg-gray-700"
              }`}
            >
              <FaChevronLeft className="w-3 h-3 mr-2" /> Previous
            </button>
            <div className="flex items-center space-x-1">
              {(() => {
                const pages = [];
                const maxVisiblePages = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                if (endPage - startPage + 1 < maxVisiblePages)
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                if (startPage > 1) {
                  pages.push(
                    <button key={1} onClick={() => handlePageChange(1)} className="px-3 py-2 text-sm font-medium rounded-lg text-gray-300 bg-gray-800 hover:bg-gray-700 transition-all duration-200">
                      1
                    </button>
                  );
                  if (startPage > 2)
                    pages.push(<span key="e1" className="px-2 text-gray-500">...</span>);
                }
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        currentPage === i
                          ? "text-white bg-blue-600"
                          : "text-gray-300 bg-gray-800 hover:bg-gray-700"
                      }`}
                    >
                      {i}
                    </button>
                  );
                }
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1)
                    pages.push(<span key="e2" className="px-2 text-gray-500">...</span>);
                  pages.push(
                    <button key={totalPages} onClick={() => handlePageChange(totalPages)} className="px-3 py-2 text-sm font-medium rounded-lg text-gray-300 bg-gray-800 hover:bg-gray-700 transition-all duration-200">
                      {totalPages}
                    </button>
                  );
                }
                return pages;
              })()}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                currentPage === totalPages
                  ? "text-gray-600 cursor-not-allowed"
                  : "text-gray-300 bg-gray-800 hover:bg-gray-700"
              }`}
            >
              Next <FaChevronRight className="w-3 h-3 ml-2" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default LostItemsPage;