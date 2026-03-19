import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaChevronLeft, FaChevronRight,
  FaLightbulb, FaTimes, FaEye, FaTag, FaTrash,
  FaWallet, FaMobileAlt, FaLaptop, FaKey, FaBriefcase,
  FaHeadphones, FaGlasses, FaBook, FaIdCard, FaUmbrella,
  FaTshirt, FaCamera, FaClock, FaTint, FaCheckCircle, 
  FaTh, FaList,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useGetLostItemsQuery, useCategoryQuery } from "../../redux/api/api";
import { useUserVerification } from "../../auth/auth";

// ── Category icon resolver ────────────────────────────────────────────────────
const getCategoryIcon = (name: string) => {
  const n = name?.toLowerCase() ?? "";
  if (n.includes("wallet") || n.includes("purse") || n.includes("pouch"))  return <FaWallet   size={9} className="text-amber-400" />;
  if (n.includes("phone") || n.includes("mobile") || n.includes("celphone")) return <FaMobileAlt size={9} className="text-cyan-400" />;
  if (n.includes("laptop") || n.includes("computer") || n.includes("electronic") || n.includes("device") || n.includes("gadget")) return <FaLaptop size={9} className="text-indigo-400" />;
  if (n.includes("key"))                                                    return <FaKey       size={9} className="text-orange-400" />;
  if (n.includes("bag") || n.includes("backpack") || n.includes("luggage")) return <FaBriefcase size={9} className="text-amber-400" />;
  if (n.includes("headphone") || n.includes("earphone") || n.includes("audio") || n.includes("airpod")) return <FaHeadphones size={9} className="text-green-400" />;
  if (n.includes("glass") || n.includes("spectacle") || n.includes("eyewear") || n.includes("sunglass")) return <FaGlasses size={9} className="text-teal-400" />;
  if (n.includes("book") || n.includes("stationery") || n.includes("notebook")) return <FaBook size={9} className="text-yellow-400" />;
  if (n.includes("id") || n.includes("card") || n.includes("document"))    return <FaIdCard   size={9} className="text-blue-400" />;
  if (n.includes("umbrella"))                                               return <FaUmbrella size={9} className="text-blue-400" />;
  if (n.includes("cloth") || n.includes("shirt") || n.includes("uniform") || n.includes("wear")) return <FaTshirt size={9} className="text-purple-400" />;
  if (n.includes("camera") || n.includes("photo"))                         return <FaCamera   size={9} className="text-violet-400" />;
  if (n.includes("watch") || n.includes("clock"))                          return <FaClock    size={9} className="text-gray-300" />;
  if (n.includes("water") || n.includes("bottle") || n.includes("tumbler") || n.includes("flask")) return <FaTint size={9} className="text-cyan-400" />;
  return <FaTag size={9} className="text-blue-400" />;
};

// ── Tip storage helpers ───────────────────────────────────────────────────────
const saveTipLocally = (id: string, tip: { location: string; details: string; time: string }) => {
  try {
    const e = JSON.parse(localStorage.getItem("bulletin_tips") || "{}");
    if (!e[id]) e[id] = [];
    e[id].push(tip);
    localStorage.setItem("bulletin_tips", JSON.stringify(e));
  } catch {}
};

const getTipsForItem = (id: string): { location: string; details: string; time: string }[] => {
  try {
    return JSON.parse(localStorage.getItem("bulletin_tips") || "{}")[id] || [];
  } catch { return []; }
};

const deleteTipLocally = (id: string, idx: number) => {
  try {
    const e = JSON.parse(localStorage.getItem("bulletin_tips") || "{}");
    if (e[id]) { e[id].splice(idx, 1); localStorage.setItem("bulletin_tips", JSON.stringify(e)); return e[id]; }
    return [];
  } catch { return []; }
};

const timeAgo = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const HIDDEN_IMAGE_CATEGORIES = ["wallets & purses", "wallet", "purse"];
const shouldHideImage = (cat: string | undefined, isAdmin: boolean) => {
  if (isAdmin) return false;
  return HIDDEN_IMAGE_CATEGORIES.some(c => cat?.toLowerCase().includes(c));
};

// ── Tip Submit Modal ──────────────────────────────────────────────────────────
const TipModal = ({ item, onClose }: { item: any; onClose: () => void }) => {
  const [location, setLocation] = useState("");
  const [details, setDetails]   = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (details.trim().length < 10) return;
    saveTipLocally(item.id, { location: location.trim() || "Location not specified", details: details.trim(), time: new Date().toISOString() });
    setSubmitted(true);
    toast.success("Tip submitted anonymously!");
    setTimeout(onClose, 1600);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <FaLightbulb className="text-blue-400" size={13} /> Submit a Sighting
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">Completely anonymous — no login needed</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <FaTimes size={12} />
          </button>
        </div>
        <div className="p-5">
          {/* Item preview */}
          <div className="flex items-center gap-3 bg-gray-800/60 border border-white/5 rounded-xl p-3 mb-4">
            <img src={item?.img || "/bgimg.png"} alt={item?.lostItemName}
              onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
              className="w-11 h-11 rounded-lg object-cover shrink-0" />
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{item?.lostItemName}</p>
              <p className="text-gray-500 text-[10px] mt-0.5 flex items-center gap-1">
                <FaMapMarkerAlt size={8} /> {item?.location}
              </p>
            </div>
            <span className="shrink-0 px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-full border border-red-500/20">Lost</span>
          </div>

          {submitted ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <FaCheckCircle className="text-emerald-400" size={20} />
              </div>
              <p className="text-white font-semibold text-sm">Tip Submitted!</p>
              <p className="text-gray-500 text-xs mt-1">Thank you for helping</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Where did you see it? <span className="text-gray-600 font-normal normal-case tracking-normal">(optional)</span>
                </label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={11} />
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Room 205, Library, Canteen..."
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  What did you see? <span className="text-red-400">*</span>
                </label>
                <textarea value={details} onChange={e => setDetails(e.target.value)} rows={3} required minLength={10}
                  placeholder="Describe what you saw, when, and any helpful details..."
                  className="w-full p-3 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30" />
                <p className="text-gray-700 text-[10px] mt-1">{details.length} / min. 10 chars</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 text-xs font-medium rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={details.trim().length < 10}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all">
                  Submit Sighting
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Tips Viewer Modal ─────────────────────────────────────────────────────────
const TipsViewerModal = ({ item, onClose, isAdmin }: { item: any; onClose: () => void; isAdmin?: boolean }) => {
  const [tips, setTips] = useState(() => getTipsForItem(item.id));
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null);

  const handleDelete = (i: number) => {
    setTips([...deleteTipLocally(item.id, i)]);
    setConfirmIdx(null);
    toast.success("Tip removed");
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl max-h-[78vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div>
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <FaEye className="text-cyan-400" size={13} /> Community Sightings
              {isAdmin && <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full font-bold">Admin</span>}
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">{item?.lostItemName} · {tips.length} {tips.length === 1 ? "sighting" : "sightings"}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <FaTimes size={12} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {tips.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                <FaEye className="text-cyan-400 opacity-40" size={18} />
              </div>
              <p className="text-white text-sm font-semibold">No sightings yet</p>
              <p className="text-gray-500 text-xs mt-1.5 leading-relaxed max-w-[220px] mx-auto">
                If you've seen this item, click <strong className="text-blue-400">"I Saw This"</strong> to help!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {tips.map((tip, i) => (
                <div key={i} className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3.5 pt-3 pb-2">
                    <FaMapMarkerAlt size={9} className="text-blue-400 shrink-0" />
                    <span className="text-blue-300 text-xs font-medium truncate flex-1">{tip.location}</span>
                    <span className="text-gray-600 text-[10px] shrink-0">{timeAgo(tip.time)}</span>
                    {isAdmin && (
                      confirmIdx === i ? (
                        <div className="flex gap-1 ml-1 shrink-0">
                          <button onClick={() => handleDelete(i)}
                            className="flex items-center gap-1 px-2 py-0.5 bg-red-500 hover:bg-red-400 text-white text-[9px] font-bold rounded transition-all">
                            <FaTrash size={7} /> Yes
                          </button>
                          <button onClick={() => setConfirmIdx(null)}
                            className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[9px] rounded transition-all">
                            No
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmIdx(i)}
                          className="ml-1 w-5 h-5 flex items-center justify-center rounded bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-400 hover:text-white transition-all shrink-0">
                          <FaTrash size={8} />
                        </button>
                      )
                    )}
                  </div>
                  <div className="px-3.5 pb-3">
                    <p className="text-gray-300 text-xs leading-relaxed">{tip.details}</p>
                    <p className="text-gray-700 text-[10px] mt-1.5">Anonymous sighting</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Merged Page ──────────────────────────────────────────────────────────
const LostItemsPage = () => {
  const users: any   = useUserVerification();
  const isAdmin      = users?.role === "ADMIN";

  const [searchTerm, setSearchTerm]         = useState("");
  const [fuzzyTerm, setFuzzyTerm]           = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [currentPage, setCurrentPage]       = useState(1);
  const [sortBy, setSortBy]                 = useState("date");
  const [sortOrder, setSortOrder]           = useState("desc");
  const [tipItem, setTipItem]               = useState<any>(null);
  const [viewTipsItem, setViewTipsItem]     = useState<any>(null);
  const [viewMode, setViewMode]             = useState<"grid" | "list">(typeof window !== "undefined" && window.innerWidth < 640 ? "list" : "grid");
  const [limit]                             = useState(12);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: lostItems, isLoading } = useGetLostItemsQuery({ searchTerm, page: currentPage, limit, sortBy, sortOrder });
  const { data: categoriesData }       = useCategoryQuery("");

  const handleFuzzyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFuzzyTerm(v);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => { setSearchTerm(v); setCurrentPage(1); }, 400);
  };
  const clearSearch = () => { setFuzzyTerm(""); setSearchTerm(""); setCurrentPage(1); };

  const filteredItems = categoryFilter === "ALL"
    ? lostItems?.data ?? []
    : (lostItems?.data ?? []).filter((i: any) => i?.category?.name?.toLowerCase() === categoryFilter.toLowerCase());

  const totalPages = lostItems?.meta?.totalPage || 1;
  const getTipCount = (id: string) => getTipsForItem(id).length;

  return (
    <div className="min-h-screen bg-gray-950 pb-16">

      {/* ── Page header ── */}
      <div className="border-b border-white/5 bg-gray-900/50">
        <div className="px-6 sm:px-10 lg:px-16 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-5 bg-red-500 rounded-full" />
                <p className="text-red-400 text-[11px] font-bold uppercase tracking-widest">Lost Items</p>
              </div>
              <h1 className="text-white text-2xl sm:text-3xl font-bold tracking-tight">Missing on Campus</h1>
              <p className="text-gray-500 text-sm mt-1 max-w-lg">
                Browse items reported missing. Seen something? Submit an anonymous sighting to help reunite owners with their belongings.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
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
              <option value="date-desc">Date Lost (Newest)</option>
              <option value="date-asc">Date Lost (Oldest)</option>
              <option value="lostItemName-asc">Name (A–Z)</option>
              <option value="lostItemName-desc">Name (Z–A)</option>
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
              <button
                onClick={() => setViewMode("grid")}
                title="Grid view"
                className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "text-gray-500 hover:text-white"}`}>
                <FaTh size={12} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                title="List view"
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

      {/* ── Cards / List ── */}
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
              ) : (
                <div key={i} className="bg-gray-900 rounded-xl border border-white/5 h-16 animate-pulse" />
              )
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-white/5 flex items-center justify-center mx-auto mb-4">
              <FaSearch className="text-gray-600" size={20} />
            </div>
            <p className="text-white font-semibold mb-1">No lost items found</p>
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
              const tipCount = getTipCount(item.id);
              const daysAgo  = Math.floor((Date.now() - new Date(item.createdAt ?? item.date).getTime()) / 86400000);
              const hideImg  = shouldHideImage(item?.category?.name, isAdmin);
              return (
                <div key={item.id} className="group bg-gray-900 border border-white/5 hover:border-blue-500/40 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-black/30 flex flex-col">
                  <div className="relative h-48 overflow-hidden bg-gray-800">
                    {hideImg ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-gray-700 border border-gray-700 flex items-center justify-center">
                          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-500" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        </div>
                        <p className="text-gray-500 text-xs">Image Hidden</p>
                        <p className="text-gray-600 text-[10px] text-center px-6 leading-relaxed">Submit a claim to verify ownership</p>
                      </div>
                    ) : (
                      <img src={(Array.isArray(item?.images) && item.images.length > 0 ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url ?? item.images[0]?.src ?? "") : "") || item?.img || "/bgimg.png"}
                        alt={item?.lostItemName} onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-0.5 bg-red-600/90 text-white text-[10px] font-bold rounded-full backdrop-blur-sm border border-red-500/30">Lost</span>
                    </div>
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full backdrop-blur-sm border ${daysAgo > 30 ? "bg-orange-500/80 text-white border-orange-400/30" : daysAgo > 7 ? "bg-yellow-500/80 text-gray-900 border-yellow-400/30" : "bg-black/50 text-white border-white/15"}`}>
                        {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
                      </span>
                    </div>
                    {tipCount > 0 && (
                      <div className="absolute bottom-3 right-3">
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/90 text-gray-900 text-[10px] font-bold rounded-full"><FaLightbulb size={8} /> {tipCount}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-white text-sm font-bold mb-1 line-clamp-1 group-hover:text-blue-400 transition-colors">{item?.lostItemName}</h3>
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
                        <span>{item?.date?.split("T")[0] ?? "—"}</span>
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
                    <div className="grid grid-cols-3 gap-1.5">
                      <button onClick={() => setTipItem(item)} disabled={!!item?.isFound}
                        className="flex items-center justify-center gap-1.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[11px] font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                         I Saw This
                      </button>
                      <button onClick={() => setViewTipsItem(item)}
                        className="flex items-center justify-center gap-1 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-[11px] font-medium rounded-lg transition-all">
                        <FaEye size={9} /> <span>{tipCount}</span>
                      </button>
                      <Link to={`/lostItems/${item.id}`} className="flex items-center justify-center py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white text-[11px] font-medium rounded-lg transition-all">Details</Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── LIST VIEW ── */
          <div className="space-y-2">
            {/* List header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] uppercase tracking-widest text-gray-600 font-semibold border-b border-white/5">
              <div className="col-span-4">Item</div>
              <div className="col-span-2">Location</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Date Lost</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {filteredItems.map((item: any) => {
              const tipCount    = getTipCount(item.id);
              const daysAgo     = Math.floor((Date.now() - new Date(item.createdAt ?? item.date).getTime()) / 86400000);
              const lostDateStr = item?.date?.split("T")[0] ?? "—";
              const hideImg     = shouldHideImage(item?.category?.name, isAdmin);
              return (
                <div key={item.id} className="group bg-gray-900 border border-white/5 hover:border-blue-500/30 rounded-xl transition-all duration-150 hover:bg-gray-900/80">
                  {/* Mobile list card */}
                  <div className="sm:hidden flex items-center gap-3 p-3">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                      {hideImg ? (
                        <div className="w-full h-full flex items-center justify-center"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-600" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg></div>
                      ) : (
                        <img src={(Array.isArray(item?.images) && item.images.length > 0 ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url ?? "") : "") || item?.img || "/bgimg.png"}
                          alt={item?.lostItemName} onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                          className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate group-hover:text-blue-400 transition-colors">{item?.lostItemName}</p>
                      <p className="text-gray-500 text-[10px] mt-0.5 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0"><FaMapMarkerAlt className="text-blue-400" size={7} /></span>
                        {item?.location}
                      </p>
                      <p className="text-gray-500 text-[10px] mt-0.5 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0"><FaCalendarAlt className="text-blue-400" size={7} /></span>
                        {lostDateStr} · <span className={daysAgo > 30 ? "text-orange-400" : daysAgo > 7 ? "text-yellow-400" : "text-gray-600"}>{daysAgo === 0 ? "Today" : `${daysAgo}d ago`}</span>
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => setTipItem(item)} disabled={!!item?.isFound}
                        className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[10px] font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        I Saw This
                      </button>
                      <div className="flex gap-1">
                        <button onClick={() => setViewTipsItem(item)}
                          className="px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-[10px] rounded-lg transition-all">
                          <FaEye size={8} className="inline mr-1" />{tipCount}
                        </button>
                        <Link to={`/lostItems/${item.id}`} className="flex items-center px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white text-[10px] rounded-lg transition-all">Details</Link>
                      </div>
                    </div>
                  </div>

                  {/* Desktop list row */}
                  <div className="hidden sm:grid grid-cols-12 gap-4 items-center px-4 py-3">
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                        {hideImg ? (
                          <div className="w-full h-full flex items-center justify-center"><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-600" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg></div>
                        ) : (
                          <img src={(Array.isArray(item?.images) && item.images.length > 0 ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url ?? "") : "") || item?.img || "/bgimg.png"}
                            alt={item?.lostItemName} onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                            className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-semibold truncate group-hover:text-blue-400 transition-colors">{item?.lostItemName}</p>
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
                          {getCategoryIcon(item.category.name)}
                          <span className="truncate">{item.category.name}</span>
                        </span>
                      ) : <span className="text-gray-600 text-xs">—</span>}
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-400 text-xs flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0"><FaCalendarAlt className="text-blue-400" size={8} /></span>
                        {lostDateStr} · <span className={`font-semibold ${daysAgo > 30 ? "text-orange-400" : daysAgo > 7 ? "text-yellow-400" : "text-gray-500"}`}>{daysAgo === 0 ? "Today" : `${daysAgo}d ago`}</span>
                      </p>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                      <button onClick={() => setTipItem(item)} disabled={!!item?.isFound}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[10px] font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
                        I Saw This
                      </button>
                      <button onClick={() => setViewTipsItem(item)}
                        className="flex items-center gap-1 px-2 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-[10px] rounded-lg transition-all">
                        <FaEye size={8} /> {tipCount}
                      </button>
                      <Link to={`/lostItems/${item.id}`} className="flex items-center px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white text-[10px] rounded-lg transition-all">Details</Link>
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
          <p className="text-gray-600 text-xs">Page {currentPage} of {totalPages} · {lostItems?.meta?.total || 0} items</p>
          <nav className="inline-flex items-center gap-1 bg-gray-900 border border-white/5 rounded-2xl p-1.5">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="flex items-center px-3.5 py-2 text-xs font-medium rounded-xl text-gray-400 hover:text-white hover:bg-white/5 disabled:text-gray-700 disabled:cursor-not-allowed transition-all">
              <FaChevronLeft size={10} className="mr-1.5" /> Prev
            </button>
            {(() => {
              const pages = [];
              const max = 5;
              let start = Math.max(1, currentPage - Math.floor(max / 2));
              let end   = Math.min(totalPages, start + max - 1);
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

      {/* ── Modals ── */}
      {tipItem      && <TipModal item={tipItem} onClose={() => setTipItem(null)} />}
      {viewTipsItem && <TipsViewerModal item={viewTipsItem} onClose={() => setViewTipsItem(null)} isAdmin={isAdmin} />}

      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
  );
};

export default LostItemsPage;