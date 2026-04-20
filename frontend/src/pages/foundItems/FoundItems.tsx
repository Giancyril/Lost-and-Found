import imageCompression from "browser-image-compression";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaChevronLeft, FaChevronRight,
  FaTimes, FaTh, FaList, FaTag, FaPlus,
  FaWallet, FaMobileAlt, FaLaptop, FaKey, FaBriefcase,
  FaHeadphones, FaGlasses, FaBook, FaIdCard, FaUmbrella,
  FaTshirt, FaCamera, FaClock, FaTint, FaCheckCircle,
  FaClipboardList, FaUser, FaEnvelope,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CustomDatePicker } from "../../components/ui/CustomDatePicker";
import { useForm } from "react-hook-form";
import { Spinner } from "flowbite-react";
import {
  useGetFoundItemsQuery,
  useCategoryQuery,
  useCreateFoundItemMutation,
  useUploadItemImagesMutation,
  useCreateClaimMutation,
} from "../../redux/api/api";
import { useUserVerification } from "../../auth/auth";

// ── Category icon resolver ────────────────────────────────────────────────────
const getCategoryIcon = (name: string) => {
  const n = name?.toLowerCase() ?? "";
  if (n.includes("wallet") || n.includes("purse") || n.includes("pouch"))   return <FaWallet    size={9} className="text-amber-400" />;
  if (n.includes("phone") || n.includes("mobile") || n.includes("celphone")) return <FaMobileAlt size={9} className="text-cyan-400" />;
  if (n.includes("laptop") || n.includes("computer") || n.includes("electronic") || n.includes("device") || n.includes("gadget")) return <FaLaptop size={9} className="text-indigo-400" />;
  if (n.includes("key"))                                                     return <FaKey        size={9} className="text-orange-400" />;
  if (n.includes("bag") || n.includes("backpack") || n.includes("luggage"))  return <FaBriefcase  size={9} className="text-amber-400" />;
  if (n.includes("headphone") || n.includes("earphone") || n.includes("audio") || n.includes("airpod")) return <FaHeadphones size={9} className="text-green-400" />;
  if (n.includes("glass") || n.includes("spectacle") || n.includes("eyewear") || n.includes("sunglass")) return <FaGlasses size={9} className="text-teal-400" />;
  if (n.includes("book") || n.includes("stationery") || n.includes("notebook")) return <FaBook size={9} className="text-yellow-400" />;
  if (n.includes("id") || n.includes("card") || n.includes("document"))     return <FaIdCard     size={9} className="text-blue-400" />;
  if (n.includes("umbrella"))                                                return <FaUmbrella   size={9} className="text-blue-400" />;
  if (n.includes("cloth") || n.includes("shirt") || n.includes("uniform") || n.includes("wear")) return <FaTshirt size={9} className="text-purple-400" />;
  if (n.includes("camera") || n.includes("photo"))                          return <FaCamera     size={9} className="text-violet-400" />;
  if (n.includes("watch") || n.includes("clock"))                           return <FaClock      size={9} className="text-gray-300" />;
  if (n.includes("water") || n.includes("bottle") || n.includes("tumbler") || n.includes("flask")) return <FaTint size={9} className="text-cyan-400" />;
  return <FaTag size={9} className="text-blue-400" />;
};

const HIDDEN_IMAGE_CATEGORIES = ["wallets & purses", "wallet", "purse"];
const shouldHideImage = (cat: string | undefined, isAdmin: boolean) => {
  if (isAdmin) return false;
  return HIDDEN_IMAGE_CATEGORIES.some(c => cat?.toLowerCase().includes(c));
};

// ── Quick Claim Modal ─────────────────────────────────────────────────────────
const QuickClaimModal = ({ item, onClose }: { item: any; onClose: () => void }) => {
  const [createClaim, { isLoading: claimLoading }] = useCreateClaimMutation();
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [submitted, setSubmitted] = useState(false);

  // ✅ Controlled lostDate state for CustomDatePicker
  const [lostDate, setLostDate] = useState("");

  const onSubmit = async (data: any) => {
    try {
      const res: any = await createClaim({
        foundItemId:            item.id,
        claimantName:           data.claimantName,
        schoolEmail:            data.schoolEmail,
        lostDate:               new Date(lostDate + "T00:00:00").toISOString(),
        distinguishingFeatures: data.distinguishingFeatures,
      });
      if (res?.data?.success) {
        setSubmitted(true);
        toast.success("Claim submitted! The SAS office will review and contact you.");
        setTimeout(onClose, 2000);
      } else {
        toast.error("Failed to submit claim. Please try again.");
      }
    } catch { toast.error("An unexpected error occurred."); }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0 bg-gray-900 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <FaClipboardList size={11} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Submit a Claim</h3>
              <p className="text-gray-500 text-[11px]">Prove ownership to retrieve this item</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <FaTimes size={12} />
          </button>
        </div>

        <div className="p-5">
          {/* Item preview */}
          <div className="flex items-center gap-3 bg-gray-800/60 border border-white/5 rounded-xl p-3 mb-5">
            <img src={(Array.isArray(item?.images) && item.images.length > 0
                ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url ?? "")
                : "") || item?.img || "/bgimg.png"}
              alt={item?.foundItemName}
              onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
              className="w-12 h-12 rounded-lg object-cover shrink-0 border border-white/5" />
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{item?.foundItemName}</p>
              <p className="text-gray-500 text-[10px] mt-0.5 flex items-center gap-1">
                <FaMapMarkerAlt size={8} /> {item?.location}
              </p>
            </div>
            <span className="shrink-0 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-full border border-blue-500/20">Available</span>
          </div>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <FaCheckCircle className="text-emerald-400" size={24} />
              </div>
              <p className="text-white font-semibold">Claim Submitted!</p>
              <p className="text-gray-500 text-xs mt-1.5 leading-relaxed max-w-xs mx-auto">
                The SAS office will review your proof and contact you via your school email.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={11} />
                  <input type="text" placeholder="Enter your full name"
                    {...register("claimantName", { required: "Full name is required" })}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>
                {errors.claimantName && <p className="text-red-400 text-xs mt-1">{errors.claimantName.message as string}</p>}
              </div>

              {/* School Email */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  School Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={11} />
                  <input type="email" placeholder="Enter your institutional email"
                    {...register("schoolEmail", {
                      required: "School email is required",
                      pattern: { value: /^[^\s@]+@nbsc\.edu\.ph$/i, message: "Must be a valid NBSC email" },
                    })}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>
                {errors.schoolEmail && <p className="text-red-400 text-xs mt-1">{errors.schoolEmail.message as string}</p>}
              </div>

              {/* ✅ Date Lost — replaced plain <input type="date"> with CustomDatePicker */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Date Item Was Lost <span className="text-red-400">*</span>
                </label>
                <CustomDatePicker
                  value={lostDate}
                  onChange={setLostDate}
                  max={new Date().toISOString().split("T")[0]}
                  placeholder="Select date lost"
                  openUp
                />
                {!lostDate && (
                  <p className="text-red-400 text-xs mt-1">Please select the date</p>
                )}
              </div>

              {/* Proof */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Proof of Ownership <span className="text-red-400">*</span>
                </label>
                <textarea rows={3} placeholder="Describe identifying details — stickers, initials, scratches, serial number, contents, etc."
                  {...register("distinguishingFeatures", {
                    required: "Please describe identifying details",
                    minLength: { value: 10, message: "At least 10 characters required" },
                  })}
                  className="w-full p-3 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                {errors.distinguishingFeatures && <p className="text-red-400 text-xs mt-1">{errors.distinguishingFeatures.message as string}</p>}
              </div>

              {/* Info note */}
              <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-3.5 py-2.5">
                <p className="text-blue-300/70 text-[11px] leading-relaxed">
                  ℹ️ Once submitted, the SAS office will verify your proof and contact you via school email before releasing the item.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { reset(); setLostDate(""); onClose(); }}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 text-xs font-medium rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={claimLoading || !lostDate}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5">
                  {claimLoading
                    ? <><svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Submitting...</>
                    : <><FaClipboardList size={10} /> Submit Claim</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const FoundItemsPage = () => {
  const users: any = useUserVerification();
  const isAdmin    = users?.role === "ADMIN";

  const [searchTerm, setSearchTerm]         = useState("");
  const [fuzzyTerm, setFuzzyTerm]           = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [currentPage, setCurrentPage]       = useState(1);
  const [sortBy, setSortBy]                 = useState("foundItemName");
  const [sortOrder, setSortOrder]           = useState("asc");
  const [viewMode, setViewMode]             = useState<"grid" | "list">(typeof window !== "undefined" && window.innerWidth < 640 ? "list" : "grid");
  const [claimItem, setClaimItem]           = useState<any>(null);
  const [limit]                             = useState(12);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Add Found Item modal (admin only) ──
  const [isAddModalOpen, setIsAddModalOpen]     = useState(false);
  const [addSelectedFile, setAddSelectedFile]   = useState<File | null>(null);
  const [addPreview, setAddPreview]             = useState<string>("");
  const [addUploadError, setAddUploadError]     = useState("");
  const [addIsDragging, setAddIsDragging]       = useState(false);

  // ✅ Add modal date: use string state + CustomDatePicker instead of DatePicker
  const [addStartDate, setAddStartDate]         = useState(new Date().toISOString().split("T")[0]);

  const [addSelectedMenucategoryId, setAddSelectedMenucategoryId] = useState("");
  const [addSelectedMenu, setAddSelectedMenu]   = useState("");
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const MAX_SIZE_MB = 5;

  const { data: foundItems, isLoading }        = useGetFoundItemsQuery({ searchTerm, page: currentPage, limit, sortBy, sortOrder });
  const { data: categoriesData }               = useCategoryQuery("");
  const [createFoundItem, { isLoading: isCreating }] = useCreateFoundItemMutation();
  const [uploadItemImages, { isLoading: isUploading }] = useUploadItemImagesMutation();
  const isBusy = isCreating || isUploading;

  const { handleSubmit: handleAddSubmit, register: addRegister, formState: { errors: addErrors }, reset: addReset } = useForm();

  const handleFuzzyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFuzzyTerm(v);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => { setSearchTerm(v); setCurrentPage(1); }, 400);
  };
  const clearSearch = () => { setFuzzyTerm(""); setSearchTerm(""); setCurrentPage(1); };

  const handleAddFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setAddUploadError("");
    let file = files[0];
    if (!file.type.startsWith("image/")) { setAddUploadError("Only image files are allowed."); return; }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setAddUploadError(`File must be under ${MAX_SIZE_MB}MB.`); return; }

    try {
      const options = { maxSizeMB: 0.4, maxWidthOrHeight: 1200, useWebWorker: true };
      file = await imageCompression(file, options);
    } catch (error) {
      console.error("Image compression error:", error);
    }

    setAddSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAddPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false); addReset();
    setAddSelectedFile(null); setAddPreview(""); setAddUploadError("");
    setAddSelectedMenu(""); setAddSelectedMenucategoryId("");
    setAddStartDate(new Date().toISOString().split("T")[0]);
  };

  const onAddSubmit = async (data: any) => {
    if (!addSelectedMenucategoryId) return;
    try {
      const res: any = await createFoundItem({
        img: addPreview || "", categoryId: addSelectedMenucategoryId,
        foundItemName: data.foundItemName, description: data.description,
        location: data.location,
        date: new Date(addStartDate + "T00:00:00"),
        claimProcess: data.claimProcess,
      });
      if (res.error || res?.data?.success === false) { toast.error("Failed to submit found item."); return; }
      if (addSelectedFile && res?.data?.data?.id) {
        const formData = new FormData();
        formData.append("images", addSelectedFile);
        formData.append("primaryIndex", "0");
        await uploadItemImages({ id: res.data.data.id, type: "found", formData });
      }
      toast.success("Found item submitted successfully!");
      closeAddModal();
    } catch { toast.error("Something went wrong. Please try again."); }
  };

  const filteredItems = categoryFilter === "ALL"
    ? foundItems?.data ?? []
    : (foundItems?.data ?? []).filter((i: any) => i?.category?.name?.toLowerCase() === categoryFilter.toLowerCase());

  const totalPages = foundItems?.meta?.totalPage || 1;

  return (
    <div className="min-h-screen bg-gray-950 pb-16">

      {/* ── Page header ── */}
      <div className="border-b border-white/5 bg-gray-900/50">
        <div className="px-6 sm:px-10 lg:px-16 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
                <p className="text-blue-400 text-[11px] font-bold uppercase tracking-widest">Found Items</p>
              </div>
              <h1 className="text-white text-2xl sm:text-3xl font-bold tracking-tight">Items Found on Campus</h1>
              <p className="text-gray-500 text-sm mt-1 max-w-lg">
                Browse items recovered and logged by the SAS office. If you recognize something, submit a claim to verify ownership.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
                <FaClipboardList size={10} className="text-blue-400" /> Submit a claim to retrieve
              </div>
              {isAdmin && (
                <button onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/30">
                  <FaPlus size={10} /> Add Found Item
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & filters ── */}
      <div className="px-6 sm:px-10 lg:px-16 py-5">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={13} />
            <input type="text" value={fuzzyTerm} onChange={handleFuzzyChange}
              placeholder="Search by name, location, or description..."
              className="w-full pl-11 pr-28 py-3 bg-gray-900 border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all" />
            {fuzzyTerm && (
              <button onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 hover:text-white text-xs rounded-lg transition-all">
                <FaTimes size={9} /> Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select value={`${sortBy}-${sortOrder}`}
              onChange={e => { const [f, o] = e.target.value.split("-"); setSortBy(f); setSortOrder(o); setCurrentPage(1); }}
              className="flex-1 min-w-0 py-2.5 px-3 text-sm text-white border border-white/5 rounded-xl bg-gray-900 focus:ring-2 focus:ring-blue-500/30 focus:outline-none">
              <option value="foundItemName-asc">Name (A–Z)</option>
              <option value="foundItemName-desc">Name (Z–A)</option>
              <option value="date-desc">Date Found (Newest)</option>
              <option value="date-asc">Date Found (Oldest)</option>
              <option value="location-asc">Location (A–Z)</option>
            </select>
            <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="flex-1 min-w-0 py-2.5 px-3 text-sm text-white border border-white/5 rounded-xl bg-gray-900 focus:ring-2 focus:ring-blue-500/30 focus:outline-none">
              <option value="ALL">All Categories</option>
              {categoriesData?.data?.map((cat: any) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            {/* View toggle */}
            <div className="flex gap-0.5 bg-gray-900 border border-white/5 rounded-xl p-1 shrink-0">
              <button onClick={() => setViewMode("grid")} title="Grid view"
                className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "text-gray-500 hover:text-white"}`}>
                <FaTh size={12} />
              </button>
              <button onClick={() => setViewMode("list")} title="List view"
                className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "text-gray-500 hover:text-white"}`}>
                <FaList size={12} />
              </button>
            </div>
          </div>
          {fuzzyTerm && (
            <p className="text-xs text-gray-600 pl-1">
              Results for <span className="text-blue-400 font-medium">"{fuzzyTerm}"</span> — updating as you type
            </p>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-6 sm:px-10 lg:px-16">
        {isLoading ? (
          <div className={viewMode === "grid" ? "grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-2"}>
            {Array.from({ length: 8 }).map((_, i) => (
              viewMode === "grid" ? (
                <div key={i} className="bg-gray-900 rounded-xl border border-white/5 overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-800/60" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-4 bg-gray-800/60 rounded-lg" />
                    <div className="h-3 bg-gray-800/60 rounded-lg w-3/4" />
                    <div className="h-8 bg-gray-800/60 rounded-xl mt-3" />
                  </div>
                </div>
              ) : <div key={i} className="bg-gray-900 rounded-xl border border-white/5 h-16 animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-white/5 flex items-center justify-center mx-auto mb-4">
              <FaSearch className="text-gray-600" size={20} />
            </div>
            <p className="text-white font-semibold mb-1">No found items</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
            {(fuzzyTerm || categoryFilter !== "ALL") && (
              <button onClick={() => { clearSearch(); setCategoryFilter("ALL"); }}
                className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
                Clear filters
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* ── GRID VIEW ── */
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item: any) => {
              const isClaimed = item?.isClaimed;
              const daysAgo   = Math.floor((Date.now() - new Date(item.createdAt ?? item.date).getTime()) / 86400000);
              const hideImg   = shouldHideImage(item?.category?.name, isAdmin);
              const dateStr   = item?.date?.split("T")[0] ?? item?.createdAt?.split("T")[0] ?? "—";

              return (
                <div key={item.id}
                  className="group bg-gray-900 border border-white/5 hover:border-blue-500/40 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-black/30 flex flex-col">

                  {/* Image */}
                  <div className="relative h-48 overflow-hidden bg-gray-800">
                    {hideImg ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-gray-700 border border-gray-700 flex items-center justify-center">
                          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-500" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-xs">Image Hidden</p>
                        <p className="text-gray-600 text-[10px] text-center px-6 leading-relaxed">Submit a claim to verify ownership</p>
                      </div>
                    ) : (
                      <img
                        src={(Array.isArray(item?.images) && item.images.length > 0
                          ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url ?? item.images[0]?.src ?? "")
                          : "") || item?.img || "/bgimg.png"}
                        alt={item?.foundItemName}
                        onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />

                    {/* Top-left: status badge */}
                    <div className="absolute top-3 left-3">
                      {isClaimed ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-600/90 text-white text-[10px] font-bold rounded-full backdrop-blur-sm border border-emerald-500/30">
                          <FaCheckCircle size={8} /> Claimed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-600/90 text-white text-[10px] font-bold rounded-full backdrop-blur-sm border border-blue-500/30">
                          Available
                        </span>
                      )}
                    </div>

                    {/* Top-right: days since found */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full backdrop-blur-sm border ${
                        !isClaimed && daysAgo > 30 ? "bg-orange-500/80 text-white border-orange-400/30" :
                        !isClaimed && daysAgo > 7  ? "bg-yellow-500/80 text-gray-900 border-yellow-400/30" :
                                                     "bg-black/50 text-white border-white/15"
                      }`}>
                        {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-white text-sm font-bold mb-1 line-clamp-1 group-hover:text-blue-400 transition-colors">
                      {item?.foundItemName}
                    </h3>
                    <p className="text-gray-500 text-xs mb-3 line-clamp-2 leading-relaxed">{item?.description}</p>

                    <div className="space-y-1.5 mt-auto mb-3">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                          <FaMapMarkerAlt className="text-blue-400" size={8} />
                        </div>
                        <span className="line-clamp-1">{item?.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                          <FaCalendarAlt className="text-blue-400" size={8} />
                        </div>
                        <span>{dateStr}</span>
                      </div>
                      {item?.category?.name && (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <div className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                            {getCategoryIcon(item.category.name)}
                          </div>
                          <span>{item.category.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="h-px bg-white/[0.04] mb-3" />

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {!isClaimed ? (
                        <button
                          onClick={() => setClaimItem(item)}
                          className="flex items-center justify-center gap-1.5 py-2 bg-blue-600/20 hover:bg-blue-600 border border-blue-600/30 text-blue-300 hover:text-white text-[11px] font-semibold rounded-lg transition-all">
                          Claim Item
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-semibold rounded-lg">
                          Claimed
                        </div>
                      )}
                      <Link to={`/foundItems/${item.id}`}
                        className="flex items-center justify-center py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white text-[11px] font-medium rounded-lg transition-all">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── LIST VIEW ── */
          <div className="space-y-2">
            <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] uppercase tracking-widest text-gray-600 font-semibold border-b border-white/5">
              <div className="col-span-3">Item</div>
              <div className="col-span-2">Location</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Date Found</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {filteredItems.map((item: any) => {
              const isClaimed = item?.isClaimed;
              const daysAgo   = Math.floor((Date.now() - new Date(item.createdAt ?? item.date).getTime()) / 86400000);
              const dateStr   = item?.date?.split("T")[0] ?? item?.createdAt?.split("T")[0] ?? "—";
              const hideImg   = shouldHideImage(item?.category?.name, isAdmin);

              return (
                <div key={item.id} className="group bg-gray-900 border border-white/5 hover:border-blue-500/30 rounded-xl transition-all duration-150">
                  {/* Mobile */}
                  <div className="sm:hidden flex items-center gap-3 p-3">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                      {hideImg ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-600" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        </div>
                      ) : (
                        <img src={(Array.isArray(item?.images) && item.images.length > 0 ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url ?? "") : "") || item?.img || "/bgimg.png"}
                          alt={item?.foundItemName} onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                          className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate group-hover:text-blue-400 transition-colors">{item?.foundItemName}</p>
                      <p className="text-gray-500 text-[10px] mt-0.5 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0"><FaMapMarkerAlt className="text-blue-400" size={7} /></span>
                        {item?.location}
                      </p>
                      <p className="text-gray-500 text-[10px] mt-0.5 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0"><FaCalendarAlt className="text-blue-400" size={7} /></span>
                        {dateStr} · <span className={daysAgo > 30 ? "text-orange-400" : daysAgo > 7 ? "text-yellow-400" : "text-gray-600"}>{daysAgo === 0 ? "Today" : `${daysAgo}d ago`}</span>
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {!isClaimed ? (
                        <button onClick={() => setClaimItem(item)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold rounded-lg transition-all">
                          Claim
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 bg-blue-600/20 border border-blue-600/30 text-blue-400 text-[10px] font-semibold rounded-lg text-center">
                          Claimed
                        </span>
                      )}
                      <Link to={`/foundItems/${item.id}`}
                        className="flex items-center justify-center px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white text-[10px] rounded-lg transition-all">
                        Details
                      </Link>
                    </div>
                  </div>

                  {/* Desktop */}
                  <div className="hidden sm:grid grid-cols-12 gap-4 items-center px-4 py-3">
                    <div className="col-span-3 flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                        {hideImg ? (
                          <div className="w-full h-full flex items-center justify-center"><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-600" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg></div>
                        ) : (
                          <img src={(Array.isArray(item?.images) && item.images.length > 0 ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url ?? "") : "") || item?.img || "/bgimg.png"}
                            alt={item?.foundItemName} onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                            className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-semibold truncate group-hover:text-blue-400 transition-colors">{item?.foundItemName}</p>
                        <p className="text-gray-500 text-xs truncate leading-relaxed">{item?.description}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-400 text-xs flex items-center gap-1.5 truncate">
                        <span className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0"><FaMapMarkerAlt className="text-blue-400" size={8} /></span>
                        {item?.location}
                      </p>
                    </div>
                    <div className="col-span-2">
                      {item?.category?.name ? (
                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                          <span className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">{getCategoryIcon(item.category.name)}</span>
                          <span className="truncate">{item.category.name}</span>
                        </span>
                      ) : <span className="text-gray-600 text-xs">—</span>}
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-400 text-xs flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0"><FaCalendarAlt className="text-blue-400" size={8} /></span>
                        {dateStr} · <span className={`font-semibold ${daysAgo > 30 ? "text-orange-400" : daysAgo > 7 ? "text-yellow-400" : "text-gray-600"}`}>{daysAgo === 0 ? "Today" : `${daysAgo}d ago`}</span>
                      </p>
                    </div>
                    <div className="col-span-1">
                      {isClaimed ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full">
                          Claimed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full">
                          Available
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                      {!isClaimed && (
                        <button onClick={() => setClaimItem(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold rounded-lg transition-all whitespace-nowrap">
                          Claim Item
                        </button>
                      )}
                      <Link to={`/foundItems/${item.id}`}
                        className="flex items-center px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white text-[10px] rounded-lg transition-all">
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center mt-12 space-y-3">
          <p className="text-gray-600 text-xs">Page {currentPage} of {totalPages} · {foundItems?.meta?.total || 0} items</p>
          <nav className="inline-flex items-center gap-1 bg-gray-900 border border-white/5 rounded-2xl p-1.5">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="flex items-center px-3.5 py-2 text-xs font-medium rounded-xl text-gray-400 hover:text-white hover:bg-white/5 disabled:text-gray-700 disabled:cursor-not-allowed transition-all">
              <FaChevronLeft size={10} className="mr-1.5" /> Prev
            </button>
            {(() => {
              const pages = []; const max = 5;
              let start = Math.max(1, currentPage - Math.floor(max / 2));
              const end   = Math.min(totalPages, start + max - 1);
              if (end - start + 1 < max) start = Math.max(1, end - max + 1);
              if (start > 1) {
                pages.push(<button key={1} onClick={() => setCurrentPage(1)} className="px-3 py-2 text-xs font-medium rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">1</button>);
                if (start > 2) pages.push(<span key="e1" className="px-1 text-gray-700 text-xs">…</span>);
              }
              for (let i = start; i <= end; i++) {
                pages.push(
                  <button key={i} onClick={() => setCurrentPage(i)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${currentPage === i ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                    {i}
                  </button>
                );
              }
              if (end < totalPages) {
                if (end < totalPages - 1) pages.push(<span key="e2" className="px-1 text-gray-700 text-xs">…</span>);
                pages.push(<button key={totalPages} onClick={() => setCurrentPage(totalPages)} className="px-3 py-2 text-xs font-medium rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">{totalPages}</button>);
              }
              return pages;
            })()}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="flex items-center px-3.5 py-2 text-xs font-medium rounded-xl text-gray-400 hover:text-white hover:bg-white/5 disabled:text-gray-700 disabled:cursor-not-allowed transition-all">
              Next <FaChevronRight size={10} className="ml-1.5" />
            </button>
          </nav>
        </div>
      )}

      {/* ── Add Found Item Modal (admin only) ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 border-t-blue-500 rounded-2xl w-full max-w-2xl shadow-2xl shadow-blue-900/20 flex flex-col max-h-[92vh]"
            style={{ borderTop: "2px solid #3b82f6", boxShadow: "0 0 30px rgba(59,130,246,0.15), 0 25px 50px rgba(0,0,0,0.5)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6M8 11h6"/></svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Log a Found Item</h2>
                  <p className="text-gray-500 text-[11px] mt-0.5">Record an item recovered on campus</p>
                </div>
              </div>
              <button onClick={closeAddModal} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <FaTimes size={12} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <form id="add-found-form" onSubmit={handleAddSubmit(onAddSubmit)} className="space-y-4">
                {/* Row 1 */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41Z"/><path d="M7 7h.01"/></svg>
                      Item Name <span className="text-red-400">*</span>
                    </label>
                    <input {...addRegister("foundItemName", { required: "Item name is required" })} type="text"
                      className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                      placeholder="e.g. Black JanSport bag" />
                    {addErrors.foundItemName && <p className="text-red-400 text-xs">{addErrors.foundItemName?.message as string}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                      Category <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select className={`w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm appearance-none pr-9 ${!addSelectedMenucategoryId ? "text-gray-500" : "text-white"}`}
                        value={addSelectedMenucategoryId}
                        onChange={e => { const cat = categoriesData?.data?.find((c: any) => c.id === e.target.value); if (cat) { setAddSelectedMenu(cat.name); setAddSelectedMenucategoryId(cat.id); } }}>
                        <option value="" disabled>Select a category</option>
                        {categoriesData?.data?.map((cat: any) => (<option key={cat.id} value={cat.id} className="text-white bg-gray-800">{cat.name}</option>))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400"><svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                    </div>
                    {!addSelectedMenu && <p className="text-red-400 text-xs">Category is required</p>}
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      Where Found <span className="text-red-400">*</span>
                    </label>
                    <input {...addRegister("location", { required: "Location is required" })} type="text"
                      className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                      placeholder="e.g. Library, Room 205" />
                    {addErrors.location && <p className="text-red-400 text-xs">{addErrors.location?.message as string}</p>}
                  </div>

                  {/* ✅ Add modal date: replaced react-datepicker with CustomDatePicker */}
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                      Date Found
                    </label>
                    <CustomDatePicker
                      value={addStartDate}
                      onChange={setAddStartDate}
                      max={new Date().toISOString().split("T")[0]}
                      placeholder="Select date found"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea {...addRegister("description", { required: "Description is required" })} rows={2}
                    className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm resize-none"
                    placeholder="Color, brand, size, distinguishing marks…" />
                  {addErrors.description && <p className="text-red-400 text-xs">{addErrors.description?.message as string}</p>}
                </div>

                {/* Claim Instructions */}
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    Claim Instructions <span className="text-red-400">*</span>
                  </label>
                  <input {...addRegister("claimProcess", { required: "Claim instructions required" })} type="text"
                    className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                    placeholder="e.g. Visit the SAS office with a valid school ID" />
                  {addErrors.claimProcess && <p className="text-red-400 text-xs">{addErrors.claimProcess?.message as string}</p>}
                </div>

                {/* Photo */}
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    Item Photo <span className="text-red-400">*</span>
                  </label>
                  {!addPreview ? (
                    <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${addIsDragging ? "border-blue-500 bg-blue-900/10" : "border-gray-700 bg-gray-800/40 hover:border-blue-500/60 hover:bg-gray-800/70"}`}
                      onClick={() => addFileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setAddIsDragging(true); }}
                      onDragLeave={() => setAddIsDragging(false)}
                      onDrop={e => { e.preventDefault(); setAddIsDragging(false); handleAddFileChange(e.dataTransfer.files); }}>
                      <input ref={addFileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleAddFileChange(e.target.files)} />
                      <div className="flex flex-col items-center gap-2.5">
                        <div className="w-12 h-12 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400">
                          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-300"><span className="text-blue-400 font-semibold">Click to upload</span> or drag & drop</p>
                          <p className="text-xs text-gray-600 mt-0.5">JPG, PNG, WEBP · Max {MAX_SIZE_MB}MB</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-800">
                      <div className="relative group">
                        <img src={addPreview} alt="Preview" className="w-full max-h-44 object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                          <button type="button" onClick={() => addFileInputRef.current?.click()} className="bg-white/90 hover:bg-white text-gray-900 text-xs font-semibold px-4 py-2 rounded-lg">Change</button>
                          <button type="button" onClick={() => { setAddSelectedFile(null); setAddPreview(""); }} className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg">Remove</button>
                        </div>
                      </div>
                      <div className="px-4 py-2.5 border-t border-gray-700 flex items-center justify-between">
                        <span className="text-xs text-gray-400 truncate">{addSelectedFile?.name}</span>
                        <span className="text-xs text-gray-500 ml-3 shrink-0">
                          {addSelectedFile ? (addSelectedFile.size < 1024 * 1024 ? (addSelectedFile.size / 1024).toFixed(1) + " KB" : (addSelectedFile.size / 1024 / 1024).toFixed(1) + " MB") : ""}
                        </span>
                      </div>
                      <input ref={addFileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleAddFileChange(e.target.files)} />
                    </div>
                  )}
                  {addUploadError && <p className="text-red-400 text-xs">{addUploadError}</p>}
                </div>
              </form>
            </div>
            {/* Sticky footer */}
            <div className="px-6 py-4 border-t border-white/5 flex gap-3 shrink-0 bg-gray-900 rounded-b-2xl">
              <button type="button" onClick={closeAddModal} disabled={isBusy}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-white/5 text-gray-300 rounded-xl text-sm font-medium transition-colors">
                Cancel
              </button>
              <button type="submit" form="add-found-form" disabled={isBusy}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {isBusy ? <><Spinner size="sm" /> Submitting…</> : "Submit Found Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Claim Modal ── */}
      {claimItem && (
        <QuickClaimModal item={claimItem} onClose={() => setClaimItem(null)} />
      )}

      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
  );
};

export default FoundItemsPage;