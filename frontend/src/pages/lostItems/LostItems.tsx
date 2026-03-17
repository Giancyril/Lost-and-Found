import { useGetLostItemsQuery, useCategoryQuery } from "../../redux/api/api";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useState, useRef } from "react";
import { useUserVerification } from "../../auth/auth";

// ── Hide image for sensitive categories (admin always sees) ──
const HIDDEN_IMAGE_CATEGORIES = ["wallets & purses", "wallet", "purse"];

const shouldHideImage = (categoryName: string | undefined, isAdmin: boolean) => {
  if (isAdmin) return false;
  return HIDDEN_IMAGE_CATEGORIES.some((c) =>
    categoryName?.toLowerCase().includes(c)
  );
};

const LostItemsPage = () => {
  const users: any = useUserVerification();
  const isAdmin = users?.role === "ADMIN";

  const [searchTerm, setSearchTerm]       = useState("");
  const [fuzzyTerm, setFuzzyTerm]         = useState("");
  const [currentPage, setCurrentPage]     = useState(1);
  const [sortBy, setSortBy]               = useState("lostItemName");
  const [sortOrder, setSortOrder]         = useState("asc");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [limit] = useState(12);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: lostItems, isLoading } = useGetLostItemsQuery({
    searchTerm,
    page: currentPage,
    limit,
    sortBy,
    sortOrder,
  });

  const { data: categoriesData } = useCategoryQuery("");

  const handleFuzzyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFuzzyTerm(value);
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

  const handleCategoryChange = (cat: string) => {
    setCategoryFilter(cat);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const clearSearch = () => {
    setFuzzyTerm("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  // ── Client-side category filter ──
  const filteredItems = categoryFilter === "ALL"
    ? lostItems?.data ?? []
    : (lostItems?.data ?? []).filter((item: any) =>
        item?.category?.name?.toLowerCase() === categoryFilter.toLowerCase()
      );

  const totalPages = lostItems?.meta?.totalPage || 1;

  if (isLoading)
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="py-8 px-6 sm:px-10 lg:px-16 mx-auto">
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

        {/* Search and Filter */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800">
          {/* Search */}
          <div className="mb-4">
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

          {/* Sort + Category dropdowns */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <FaFilter className="text-gray-500 shrink-0" size={13} />
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
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="block w-full sm:w-56 p-2.5 text-sm text-white border border-gray-700 rounded-lg bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="ALL">All Categories</option>
              {categoriesData?.data?.map((cat: any) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="px-6 sm:px-10 lg:px-16">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-900 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center border border-gray-800">
              <FaSearch className="text-gray-600 text-2xl" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {fuzzyTerm || categoryFilter !== "ALL" ? "No items found" : "No lost items yet"}
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              {fuzzyTerm
                ? `No items found for "${fuzzyTerm}". Try different keywords.`
                : categoryFilter !== "ALL"
                ? `No lost items found in "${categoryFilter}".`
                : "No lost items have been reported yet. Check back later!"}
            </p>
            {(fuzzyTerm || categoryFilter !== "ALL") && (
              <button
                onClick={() => { clearSearch(); handleCategoryChange("ALL"); }}
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all duration-200"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((lostItem: any) => (
              <div
                key={`${lostItem?.id}127`}
                className="group relative bg-gray-900 rounded-xl overflow-hidden transition-all duration-300 border border-gray-800 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-900/20 flex flex-col"
              >
                <div className="relative overflow-hidden">
                  <div className="h-52 w-full overflow-hidden">
                    {shouldHideImage(lostItem?.category?.name, isAdmin) ? (
                      <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center gap-2">
                        <div className="w-14 h-14 rounded-full bg-gray-700 border border-gray-700 flex items-center justify-center">
                          <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-500" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-xs font-medium">Image Hidden</p>
                        <p className="text-gray-600 text-[10px] text-center px-4 leading-relaxed">
                          Submit a claim to verify ownership
                        </p>
                      </div>
                    ) : (
                      <img
                        src={
                          (Array.isArray(lostItem?.images) && lostItem.images.length > 0
                            ? (typeof lostItem.images[0] === "string" ? lostItem.images[0] : lostItem.images[0]?.url ?? lostItem.images[0]?.src ?? "")
                            : "") || lostItem?.img || "/bgimg.png"
                        }
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        alt={lostItem?.lostItemName}
                        width={500}
                        height={500}
                        onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                  <div className="absolute top-3 right-3 bg-red-600/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-red-500/40">
                    Lost
                  </div>
                </div>

                <div className="p-5 text-white flex flex-col flex-1">
                  <h3 className="text-base font-bold mb-2 text-white group-hover:text-blue-400 transition-colors duration-200 line-clamp-1">
                    {lostItem?.lostItemName}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {lostItem?.description}
                  </p>
                  <div className="space-y-2 mt-auto mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <FaCalendarAlt className="text-blue-400" size={10} />
                      </div>
                      <span>{lostItem?.date.split("T")[0]}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <FaMapMarkerAlt className="text-blue-400" size={10} />
                      </div>
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
      {totalPages > 1 && categoryFilter === "ALL" && (
        <div className="flex flex-col items-center mt-12 pb-8 space-y-4">
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages} ({lostItems?.meta?.total || 0} total items)
          </div>
          <nav className="inline-flex items-center space-x-1 bg-gray-900 rounded-2xl p-2 border border-gray-800">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                currentPage === 1 ? "text-gray-600 cursor-not-allowed" : "text-gray-300 bg-gray-800 hover:bg-gray-700"
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
                  pages.push(<button key={1} onClick={() => handlePageChange(1)} className="px-3 py-2 text-sm font-medium rounded-lg text-gray-300 bg-gray-800 hover:bg-gray-700 transition-all duration-200">1</button>);
                  if (startPage > 2) pages.push(<span key="e1" className="px-2 text-gray-500">...</span>);
                }
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button key={i} onClick={() => handlePageChange(i)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${currentPage === i ? "text-white bg-blue-600" : "text-gray-300 bg-gray-800 hover:bg-gray-700"}`}>
                      {i}
                    </button>
                  );
                }
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) pages.push(<span key="e2" className="px-2 text-gray-500">...</span>);
                  pages.push(<button key={totalPages} onClick={() => handlePageChange(totalPages)} className="px-3 py-2 text-sm font-medium rounded-lg text-gray-300 bg-gray-800 hover:bg-gray-700 transition-all duration-200">{totalPages}</button>);
                }
                return pages;
              })()}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                currentPage === totalPages ? "text-gray-600 cursor-not-allowed" : "text-gray-300 bg-gray-800 hover:bg-gray-700"
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