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
import {
  useCategoryQuery,
  useCreateFoundItemMutation,
  useUploadItemImagesMutation,
} from "../../redux/api/api";
import { useUserVerification } from "../../auth/auth";

const FoundItemsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [fuzzyTerm, setFuzzyTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("foundItemName");
  const [sortOrder, setSortOrder] = useState("asc");
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
  const [addSelectedFiles, setAddSelectedFiles] = useState<File[]>([]);
  const [addPreviews, setAddPreviews] = useState<string[]>([]);
  const [addPrimaryIdx, setAddPrimaryIdx] = useState(0);
  const [addUploadError, setAddUploadError] = useState("");
  const [addIsDragging, setAddIsDragging] = useState(false);
  const [addStartDate, setAddStartDate] = useState(new Date());
  const [addSelectedMenu, setAddSelectedMenu] = useState("");
  const [addSelectedMenucategoryId, setAddSelectedMenucategoryId] = useState("");
  const addFileInputRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGES = 6;
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
    if (!files) return;
    setAddUploadError("");
    const incoming = Array.from(files);
    const valid = incoming.filter((f) => {
      if (!f.type.startsWith("image/")) { setAddUploadError("Only image files allowed."); return false; }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) { setAddUploadError(`Max ${MAX_SIZE_MB}MB each.`); return false; }
      return true;
    });
    const combined = [...addSelectedFiles, ...valid].slice(0, MAX_IMAGES);
    if (addSelectedFiles.length + valid.length > MAX_IMAGES) setAddUploadError(`Max ${MAX_IMAGES} images.`);
    setAddSelectedFiles(combined);
    setAddPreviews(combined.map((f) => URL.createObjectURL(f)));
  };

  const removeAddFile = (idx: number) => {
    const updated = addSelectedFiles.filter((_, i) => i !== idx);
    setAddSelectedFiles(updated);
    setAddPreviews(updated.map((f) => URL.createObjectURL(f)));
    if (addPrimaryIdx >= updated.length) setAddPrimaryIdx(0);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    addReset();
    setAddSelectedFiles([]);
    setAddPreviews([]);
    setAddPrimaryIdx(0);
    setAddUploadError("");
    setAddSelectedMenu("");
    setAddSelectedMenucategoryId("");
    setAddStartDate(new Date());
  };

  const onAddSubmit = async (data: any) => {
    if (!addSelectedMenucategoryId) return;
    try {
      const foundData = {
        img: addPreviews[addPrimaryIdx] || "",
        categoryId: addSelectedMenucategoryId,
        foundItemName: data.foundItemName,
        description: data.description,
        location: data.location,
        date: addStartDate,
        claimProcess: data.claimProcess,
      };
      const res: any = await createFoundItem(foundData);
      if (res?.data?.success === false) return;
      if (addSelectedFiles.length > 0 && res?.data?.data?.id) {
        const formData = new FormData();
        addSelectedFiles.forEach((file) => formData.append("images", file));
        formData.append("primaryIndex", String(addPrimaryIdx));
        await uploadItemImages({ id: res.data.data.id, type: "found", formData });
      }
      closeAddModal();
    } catch {}
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
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-all duration-200 text-sm shadow-lg shadow-green-900/30"
            >
              <FaPlus size={12} /> Add Found Item
            </button>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-8 border border-gray-800">
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
                <option value="foundItemName-asc">Name (A-Z)</option>
                <option value="foundItemName-desc">Name (Z-A)</option>
                <option value="date-desc">Date (Newest First)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="location-asc">Location (A-Z)</option>
                <option value="location-desc">Location (Z-A)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="px-6 sm:px-10 lg:px-16">
        {foundItems?.data?.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-900 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center border border-gray-800">
              <FaSearch className="text-gray-600 text-2xl" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {fuzzyTerm ? "No items found" : "No found items yet"}
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              {fuzzyTerm
                ? `No items found for "${fuzzyTerm}". Try different keywords.`
                : "No found items have been reported yet. Check back later!"}
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
            {foundItems?.data?.map((foundItem: any) => (
              <div
                key={foundItem.id}
                className="group relative bg-gray-900 rounded-xl overflow-hidden transition-all duration-300 border border-gray-800 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-900/20 flex flex-col"
              >
                <div className="relative overflow-hidden">
                  <div className="h-52 w-full overflow-hidden">
                    <img
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      src={foundItem?.img}
                      alt={foundItem?.foundItemName}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
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
      {totalPages > 1 && (
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

              {/* Image Upload */}
              <div>
                <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">
                  Item Photos{" "}
                  <span className="text-gray-500 normal-case font-normal">(up to {MAX_IMAGES} images)</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
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
                    multiple
                    className="hidden"
                    onChange={(e) => handleAddFileChange(e.target.files)}
                  />
                  <div className="text-gray-400 text-sm">
                    <span className="text-blue-400 font-medium">Click to upload</span> or drag & drop
                    <p className="text-xs text-gray-600 mt-1">
                      JPG, PNG, WEBP · Max {MAX_SIZE_MB}MB each · {addSelectedFiles.length}/{MAX_IMAGES} selected
                    </p>
                  </div>
                </div>

                {addUploadError && <p className="text-red-400 text-xs mt-1.5">{addUploadError}</p>}

                {addPreviews.length > 0 && (
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
                      {addPreviews.map((src, idx) => (
                        <div
                          key={idx}
                          className={`relative rounded-lg overflow-hidden aspect-square border-2 transition-all duration-200 cursor-pointer ${
                            idx === addPrimaryIdx
                              ? "border-blue-500 ring-2 ring-blue-500/30"
                              : "border-gray-700 hover:border-gray-500"
                          }`}
                          onClick={() => setAddPrimaryIdx(idx)}
                          title="Click to set as cover photo"
                        >
                          <img src={src} className="w-full h-full object-cover" alt="" />
                          {idx === addPrimaryIdx && (
                            <div className="absolute bottom-0 left-0 right-0 bg-blue-600/90 text-white text-center text-[10px] font-bold py-0.5">
                              Cover
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeAddFile(idx); }}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-red-600 rounded-full text-white text-xs flex items-center justify-center transition-colors duration-150"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">Click a photo to set it as the cover image</p>
                  </>
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
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isBusy ? <><Spinner size="sm" /> Submitting...</> : "Submit Found Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoundItemsPage;