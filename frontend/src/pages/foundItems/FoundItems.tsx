import { useGetFoundItemsQuery } from "../../redux/api/api";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import { useState, useRef } from "react";
import { Spinner } from "flowbite-react";
import { useForm } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  useCategoryQuery,
  useCreateFoundItemMutation,
  useUploadItemImagesMutation,
} from "../../redux/api/api";
import { useUserVerification } from "../../auth/auth";

// ── Hide image for sensitive categories (admin always sees) ──
const HIDDEN_IMAGE_CATEGORIES = ["wallets & purses", "wallet", "purse"];

const shouldHideImage = (categoryName: string | undefined, isAdmin: boolean) => {
  if (isAdmin) return false;
  return HIDDEN_IMAGE_CATEGORIES.some((c) =>
    categoryName?.toLowerCase().includes(c)
  );
};

const FoundItemsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [fuzzyTerm, setFuzzyTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("foundItemName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [limit] = useState(12);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: foundItems, isLoading } = useGetFoundItemsQuery({
    searchTerm,
    page: currentPage,
    limit,
    sortBy,
    sortOrder,
  });

  // ── Admin check ──
  const users: any = useUserVerification();
  const isAdmin = users?.role === "ADMIN";

  // ── Add Found Item modal state ──
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSelectedFile, setAddSelectedFile] = useState<File | null>(null);
  const [addPreview, setAddPreview] = useState<string>("");
  const [addUploadError, setAddUploadError] = useState("");
  const [addIsDragging, setAddIsDragging] = useState(false);
  const [addStartDate, setAddStartDate] = useState(new Date());
  const [addSelectedMenu, setAddSelectedMenu] = useState("");
  const [addSelectedMenucategoryId, setAddSelectedMenucategoryId] = useState("");
  const addFileInputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE_MB = 5;

  const { data: Category } = useCategoryQuery("");
  const [createFoundItem, { isLoading: isCreating }] = useCreateFoundItemMutation();
  const [uploadItemImages, { isLoading: isUploading }] = useUploadItemImagesMutation();
  const isBusy = isCreating || isUploading;

  const {
    handleSubmit: handleAddSubmit,
    register: addRegister,
    formState: { errors: addErrors },
    reset: addReset,
  } = useForm();

  const handleAddFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setAddUploadError("");
    const file = files[0];
    if (!file.type.startsWith("image/")) { setAddUploadError("Only image files are allowed."); return; }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setAddUploadError(`File must be under ${MAX_SIZE_MB}MB.`); return; }
    setAddSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAddPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeAddFile = () => {
    setAddSelectedFile(null);
    setAddPreview("");
    setAddUploadError("");
    if (addFileInputRef.current) addFileInputRef.current.value = "";
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    addReset();
    setAddSelectedFile(null);
    setAddPreview("");
    setAddUploadError("");
    setAddSelectedMenu("");
    setAddSelectedMenucategoryId("");
    setAddStartDate(new Date());
  };

  const onAddSubmit = async (data: any) => {
    if (!addSelectedMenucategoryId) return;
    try {
      const foundData = {
        img: addPreview || "",
        categoryId: addSelectedMenucategoryId,
        foundItemName: data.foundItemName,
        description: data.description,
        location: data.location,
        date: addStartDate,
        claimProcess: data.claimProcess,
      };
      const res: any = await createFoundItem(foundData);
      if (res?.data?.success === false) {
        toast.error("Failed to submit found item. Please try again.");
        return;
      }
      if (addSelectedFile && res?.data?.data?.id) {
        const formData = new FormData();
        formData.append("images", addSelectedFile);
        formData.append("primaryIndex", "0");
        await uploadItemImages({ id: res.data.data.id, type: "found", formData });
      }
      toast.success("Found item submitted successfully!");
      closeAddModal();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  // ── Search / sort / pagination handlers ──
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

  const handlePageChange = (page: number) => setCurrentPage(page);

  const clearSearch = () => {
    setFuzzyTerm("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setCategoryFilter(cat);
    setCurrentPage(1);
  };

  // ── Client-side category filter ──
  const filteredItems = categoryFilter === "ALL"
    ? foundItems?.data ?? []
    : (foundItems?.data ?? []).filter((item: any) =>
        item?.category?.name?.toLowerCase() === categoryFilter.toLowerCase()
      );

  const totalPages = foundItems?.meta?.totalPage || 1;

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

        {/* Admin — Add Found Item button */}
        {isAdmin && (
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 text-sm shadow-lg shadow-blue-900/30"
            >
              <FaPlus size={12} /> Add Found Item
            </button>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 mb-8 border border-gray-800 overflow-hidden">
          <div className="mb-5">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={13} />
              <input
                type="search"
                className="block w-full py-3 pl-11 pr-16 text-sm text-white border border-gray-700 rounded-xl bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 transition-all duration-200"
                placeholder="Search by name, location, or description..."
                value={fuzzyTerm}
                onChange={handleFuzzyInputChange}
              />
              {fuzzyTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500 hover:text-white text-xs transition-colors whitespace-nowrap"
                >
                  <span>✕</span>
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
            {fuzzyTerm && (
              <p className="text-xs text-gray-500 mt-2 ps-1">
                Showing results for{" "}
                <span className="text-blue-400 font-medium">"{fuzzyTerm}"</span>
                {" "}— results update as you type
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-500 shrink-0 hidden sm:block" size={13} />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={handleSortChange}
              className="flex-1 min-w-0 p-2.5 text-sm text-white border border-gray-700 rounded-lg bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="foundItemName-asc">Name (A-Z)</option>
              <option value="foundItemName-desc">Name (Z-A)</option>
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="location-asc">Location (A-Z)</option>
              <option value="location-desc">Location (Z-A)</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="flex-1 min-w-0 p-2.5 text-sm text-white border border-gray-700 rounded-lg bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="ALL">All Categories</option>
              {Category?.data?.map((cat: any) => (
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
              {fuzzyTerm || categoryFilter !== "ALL" ? "No items found" : "No found items yet"}
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              {fuzzyTerm
                ? `No items found for "${fuzzyTerm}". Try different keywords.`
                : categoryFilter !== "ALL"
                ? `No found items in "${categoryFilter}".`
                : "No found items have been reported yet. Check back later!"}
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
            {filteredItems.map((foundItem: any) => (
              <div
                key={foundItem.id}
                className="group relative bg-gray-900 rounded-xl overflow-hidden transition-all duration-300 border border-gray-800 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-900/20 flex flex-col"
              >
                {/* ── Card image area — single flattened container ── */}
                <div className="relative h-52 w-full overflow-hidden">
                  {shouldHideImage(foundItem?.category?.name, isAdmin) ? (
                    <div className="absolute inset-0 bg-gray-800 flex flex-col items-center justify-center gap-2">
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
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      src={
                        (Array.isArray(foundItem?.images) && foundItem.images.length > 0
                          ? (typeof foundItem.images[0] === "string" ? foundItem.images[0] : foundItem.images[0]?.url ?? foundItem.images[0]?.src ?? "")
                          : "") || foundItem?.img || "/bgimg.png"
                      }
                      alt={foundItem?.foundItemName}
                      width={500}
                      height={500}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {foundItem?.isClaimed ? (
                    <div className="absolute top-3 right-3 bg-green-600/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-green-500/40">
                      ✓ Claimed
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 bg-blue-600/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-blue-500/40">
                      Available
                    </div>
                  )}
                </div>

                <div className="p-5 text-white flex flex-col flex-1">
                  <h3 className="text-base font-bold mb-2 text-white group-hover:text-blue-400 transition-colors duration-200 line-clamp-1">
                    {foundItem?.foundItemName}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {foundItem?.description}
                  </p>
                  <div className="space-y-2 mt-auto mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <FaCalendarAlt className="text-blue-400" size={10} />
                      </div>
                      <span>{foundItem?.date ? foundItem.date.split("T")[0] : foundItem?.createdAt?.split("T")[0]}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <FaMapMarkerAlt className="text-blue-400" size={10} />
                      </div>
                      <span className="line-clamp-1">{foundItem?.location}</span>
                    </div>
                  </div>
                  <Link to={`/foundItems/${foundItem?.id}`} className="block">
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
            Page {currentPage} of {totalPages} ({foundItems?.meta?.total || 0} total items)
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

      {/* ── Add Found Item Modal (admin only) ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-2xl border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <div>
                <h2 className="text-base font-bold text-white">Add Found Item</h2>
                <p className="text-gray-500 text-xs mt-0.5">Fill out the details to log an item found on campus</p>
              </div>
              <button onClick={closeAddModal} className="text-gray-500 hover:text-white p-1 transition-colors">
                <FaTimes size={15} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit(onAddSubmit)} className="p-6 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">

                {/* Item Name */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Item Name</label>
                  <input
                    {...addRegister("foundItemName", { required: "Item name is required" })}
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. Black laptop, Blue water bottle"
                  />
                  {addErrors.foundItemName && <p className="text-red-400 text-xs mt-1">{addErrors.foundItemName?.message as string}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Description</label>
                  <input
                    {...addRegister("description", { required: "Description is required" })}
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Color, brand, size, markings"
                  />
                  {addErrors.description && <p className="text-red-400 text-xs mt-1">{addErrors.description?.message as string}</p>}
                </div>

                {/* Location */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Where Found</label>
                  <input
                    {...addRegister("location", { required: "Location is required" })}
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. Library, Canteen, Room 205"
                  />
                  {addErrors.location && <p className="text-red-400 text-xs mt-1">{addErrors.location?.message as string}</p>}
                </div>

                {/* Claim Instructions */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Claim Instructions</label>
                  <input
                    {...addRegister("claimProcess", { required: "Claim instructions are required" })}
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. Visit the SAS office with valid ID"
                  />
                  {addErrors.claimProcess && <p className="text-red-400 text-xs mt-1">{addErrors.claimProcess?.message as string}</p>}
                </div>

                {/* Date Found */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Date Found</label>
                  <DatePicker
                    wrapperClassName="w-full"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    selected={addStartDate}
                    onChange={(date: any) => setAddStartDate(date)}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select date"
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    maxDate={new Date()}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Category</label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer text-sm"
                      value={addSelectedMenucategoryId}
                      onChange={(e) => {
                        const cat = Category?.data?.find((c: any) => c.id === e.target.value);
                        if (cat) {
                          setAddSelectedMenu(cat.name);
                          setAddSelectedMenucategoryId(cat.id);
                        }
                      }}
                    >
                      <option value="" disabled className="text-gray-500">Select a category</option>
                      {Category?.data?.map((cat: any) => (
                        <option key={cat.id} value={cat.id} className="text-white bg-gray-800">{cat.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                  {!addSelectedMenu && (
                    <p className="text-red-400 text-xs mt-1">Category is required</p>
                  )}
                </div>

              </div>

              {/* Single Image Upload */}
              <div>
                <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">
                  Item Photo <span className="text-red-500 ml-1">*</span>
                </label>

                {!addPreview ? (
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                      addIsDragging
                        ? "border-blue-500 bg-blue-900/10"
                        : "border-gray-700 bg-gray-800/50 hover:border-blue-500 hover:bg-gray-800"
                    }`}
                    onClick={() => addFileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setAddIsDragging(true); }}
                    onDragLeave={() => setAddIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setAddIsDragging(false);
                      handleAddFileChange(e.dataTransfer.files);
                    }}
                  >
                    <input
                      ref={addFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAddFileChange(e.target.files)}
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-gray-700 flex items-center justify-center text-gray-400">
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm">
                        <span className="text-blue-400 font-medium">Click to upload</span> or drag & drop
                      </p>
                      <p className="text-xs text-gray-600">JPG, PNG · Max {MAX_SIZE_MB}MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border-2 border-blue-500 bg-gray-800">
                    <img
                      src={addPreview}
                      alt="Preview"
                      className="w-full max-h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => addFileInputRef.current?.click()}
                        className="bg-white/90 hover:bg-white text-gray-900 text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-150"
                      >
                        Change Photo
                      </button>
                      <button
                        type="button"
                        onClick={removeAddFile}
                        className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-150"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="px-3 py-2 bg-gray-900/90 border-t border-gray-700 flex items-center justify-between">
                      <span className="text-xs text-gray-400 truncate">{addSelectedFile?.name}</span>
                      <span className="text-xs text-gray-500 ml-2 shrink-0">
                        {addSelectedFile ? (addSelectedFile.size / 1024 / 1024).toFixed(1) + " MB" : ""}
                      </span>
                    </div>
                    <input
                      ref={addFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAddFileChange(e.target.files)}
                    />
                  </div>
                )}

                {addUploadError && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <span>⚠</span> {addUploadError}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={isBusy}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isBusy ? <><Spinner size="sm" /> Submitting...</> : "Submit Found Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} style={{ top: "70px" }} theme="dark" />
    </div>
  );
};

export default FoundItemsPage;