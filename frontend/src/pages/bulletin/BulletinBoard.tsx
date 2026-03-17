import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaFilter,
  FaLightbulb, FaTimes, FaChevronLeft, FaChevronRight,
  FaCheckCircle, FaPaperPlane,
  FaEye, FaTag, FaRegClock,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useGetLostItemsQuery, useCategoryQuery } from "../../redux/api/api";

// ── Tip persistence (localStorage) ───────────────────────────────────────────
const saveTipLocally = (id: string, tip: { location: string; details: string; time: string }) => {
  try {
    const ex = JSON.parse(localStorage.getItem("bulletin_tips") || "{}");
    if (!ex[id]) ex[id] = [];
    ex[id].push(tip);
    localStorage.setItem("bulletin_tips", JSON.stringify(ex));
  } catch {}
};
const getTipsForItem = (id: string): { location: string; details: string; time: string }[] => {
  try { return JSON.parse(localStorage.getItem("bulletin_tips") || "{}")[id] || []; }
  catch { return []; }
};
const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ── Tip Modal ─────────────────────────────────────────────────────────────────
const TipModal = ({ item, onClose }: { item: any; onClose: () => void }) => {
  const [location, setLocation] = useState("");
  const [details, setDetails]   = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;
    saveTipLocally(item.id, { location: location.trim() || "Location not specified", details: details.trim(), time: new Date().toISOString() });
    setSubmitted(true);
    toast.success("Your tip has been submitted anonymously!");
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1117] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div>
            <h3 className="text-white font-bold text-base tracking-tight flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                <FaLightbulb className="text-amber-400" size={11} />
              </span>
              Submit a Tip
            </h3>
            <p className="text-gray-500 text-xs mt-1">Completely anonymous · No account needed</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <FaTimes size={13} />
          </button>
        </div>
        <div className="p-6">
          {/* Item preview */}
          <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-3 mb-5 border border-white/5">
            <img src={item?.img || "/bgimg.png"} alt={item?.lostItemName}
              onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
              className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/10" />
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{item?.lostItemName}</p>
              <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                <FaMapMarkerAlt size={8} /> {item?.location}
              </p>
            </div>
            <span className="shrink-0 px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-semibold rounded-md border border-red-500/20 uppercase tracking-wide">
              Lost
            </span>
          </div>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="text-emerald-400" size={22} />
              </div>
              <p className="text-white font-bold text-base">Tip Submitted!</p>
              <p className="text-gray-500 text-sm mt-1">Thank you for helping reunite lost items</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Where did you see it? <span className="text-gray-600 font-normal normal-case tracking-normal">(optional)</span>
                </label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={11} />
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Room 205, Library, Canteen..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500/30 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  What did you see? <span className="text-red-400">*</span>
                </label>
                <textarea value={details} onChange={e => setDetails(e.target.value)} rows={4} required minLength={10}
                  placeholder="Describe what you saw, when, and any helpful details..."
                  className="w-full p-3 bg-white/[0.04] border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500/30 transition-all" />
                <p className="text-gray-600 text-[10px] mt-1.5">{details.length} chars · min. 10 required</p>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3 flex items-start gap-2.5">
                <span className="text-amber-400 text-xs mt-0.5">🔒</span>
                <p className="text-amber-300/70 text-xs leading-relaxed">
                  Your tip is submitted <strong className="text-amber-300">completely anonymously</strong>. No personal information is collected.
                </p>
              </div>
              <div className="flex gap-2.5 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/8 border border-white/8 text-gray-400 hover:text-white text-sm font-medium rounded-xl transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={details.trim().length < 10}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-gray-950 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                  <FaPaperPlane size={11} /> Submit Tip
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
const TipsViewerModal = ({ item, onClose }: { item: any; onClose: () => void }) => {
  const tips = getTipsForItem(item.id);
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1117] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
          <div>
            <h3 className="text-white font-bold text-base tracking-tight flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
                <FaEye className="text-cyan-400" size={11} />
              </span>
              Community Tips
            </h3>
            <p className="text-gray-500 text-xs mt-1">{item?.lostItemName} · <span className="text-cyan-400">{tips.length} tip{tips.length !== 1 ? "s" : ""}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <FaTimes size={13} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {tips.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-3">
                <FaLightbulb size={20} className="opacity-30" />
              </div>
              <p className="text-sm text-gray-500">No tips yet</p>
              <p className="text-xs mt-1 opacity-50">Be the first to submit a tip!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tips.map((tip, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-orange-300 font-medium">
                      <FaMapMarkerAlt size={9} className="text-orange-400" />
                      {tip.location}
                    </div>
                    <span className="text-gray-600 text-[10px] flex items-center gap-1">
                      <FaRegClock size={8} /> {timeAgo(tip.time)}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{tip.details}</p>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-gray-600" />
                    <span className="text-gray-600 text-[10px]">Anonymous tip</span>
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

// ── Days badge color ──────────────────────────────────────────────────────────
const daysBadgeClass = (d: number) =>
  d > 30 ? "bg-orange-500/80 text-white border-orange-400/30" :
  d > 7  ? "bg-amber-400/70 text-gray-900 border-amber-300/30" :
           "bg-white/10 text-white border-white/15";

// ── Main Bulletin Board ───────────────────────────────────────────────────────
const BulletinBoard = () => {
  const [searchTerm, setSearchTerm]         = useState("");
  const [fuzzyTerm, setFuzzyTerm]           = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [currentPage, setCurrentPage]       = useState(1);
  const [sortBy, setSortBy]                 = useState("date");
  const [sortOrder, setSortOrder]           = useState("desc");
  const [tipItem, setTipItem]               = useState<any>(null);
  const [viewTipsItem, setViewTipsItem]     = useState<any>(null);
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

  const totalPages  = lostItems?.meta?.totalPage || 1;
  const totalItems  = lostItems?.meta?.total || 0;
  const getTipCount = (id: string) => getTipsForItem(id).length;

  return (
    <div className="min-h-screen bg-[#080a0f] pb-20">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden border-b border-white/5">
        {/* Background texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-[#080a0f] to-[#080a0f]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-500/5 rounded-full blur-[100px]" />

        <div className="relative px-6 sm:px-10 lg:px-16 py-12 sm:py-16">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/8 border border-red-500/15 rounded-full text-red-400 text-[11px] font-semibold uppercase tracking-widest mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              Community Bulletin Board
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1] mb-4">
              Lost Items<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                Bulletin Board
              </span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-lg mb-8">
              Help reunite students with their lost belongings. If you've spotted any of these items, submit an anonymous tip — no login required.
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 px-3.5 py-2 bg-white/[0.04] border border-white/8 rounded-xl text-xs text-gray-400">
                <FaLightbulb className="text-amber-400" size={11} />
                <span>Anonymous tips welcome</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 bg-white/[0.04] border border-white/8 rounded-xl text-xs text-gray-400">
                <FaCheckCircle className="text-emerald-400" size={11} />
                <span>No login required</span>
              </div>
              <Link to="/lostItems"
                className="flex items-center gap-2 px-3.5 py-2 bg-blue-500/8 border border-blue-500/15 rounded-xl text-xs text-blue-400 hover:bg-blue-500/15 transition-colors font-medium">
                Full lost items list →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filters ── */}
      <div className="px-6 sm:px-10 lg:px-16 py-6">
        <div className="bg-white/[0.03] rounded-2xl p-4 sm:p-5 border border-white/5">
          <div className="mb-3.5">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
              <input type="search" value={fuzzyTerm} onChange={handleFuzzyChange}
                placeholder="Search by item name, location, or description..."
                className="w-full pl-11 pr-10 py-3 bg-white/[0.04] border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500/25 transition-all" />
              {fuzzyTerm && (
                <button onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-white/8 hover:bg-white/15 flex items-center justify-center text-gray-400 hover:text-white transition-all text-[10px]">
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-600 shrink-0 hidden sm:block" size={11} />
            <select value={`${sortBy}-${sortOrder}`}
              onChange={e => { const [f,o] = e.target.value.split("-"); setSortBy(f); setSortOrder(o); setCurrentPage(1); }}
              className="flex-1 min-w-0 px-3 py-2.5 text-sm text-gray-300 border border-white/8 rounded-xl bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-red-500/30">
              <option value="date-desc">Date Lost (Newest)</option>
              <option value="date-asc">Date Lost (Oldest)</option>
              <option value="lostItemName-asc">Name (A–Z)</option>
              <option value="lostItemName-desc">Name (Z–A)</option>
            </select>
            <select value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="flex-1 min-w-0 px-3 py-2.5 text-sm text-gray-300 border border-white/8 rounded-xl bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-red-500/30">
              <option value="ALL">All Categories</option>
              {categoriesData?.data?.map((cat: any) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Results count */}
          {!isLoading && (
            <p className="text-gray-600 text-xs mt-3">
              {filteredItems.length === 0
                ? "No items found"
                : <>Showing <span className="text-gray-400">{filteredItems.length}</span> of <span className="text-gray-400">{totalItems}</span> lost items</>
              }
              {fuzzyTerm && <> for <span className="text-red-400">"{fuzzyTerm}"</span></>}
            </p>
          )}
        </div>
      </div>

      {/* ── Cards Grid ── */}
      <div className="px-6 sm:px-10 lg:px-16">
        {isLoading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white/[0.03] rounded-2xl overflow-hidden border border-white/5 animate-pulse">
                <div className="h-52 bg-white/[0.04]" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 bg-white/[0.04] rounded-lg w-3/4" />
                  <div className="h-3 bg-white/[0.04] rounded-lg" />
                  <div className="h-3 bg-white/[0.04] rounded-lg w-1/2" />
                  <div className="h-9 bg-white/[0.04] rounded-xl mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-4">
              <FaSearch className="text-gray-600" size={20} />
            </div>
            <p className="text-white font-bold text-lg mb-2">No lost items found</p>
            <p className="text-gray-500 text-sm mb-6">Try adjusting your search or filters</p>
            {(fuzzyTerm || categoryFilter !== "ALL") && (
              <button onClick={() => { clearSearch(); setCategoryFilter("ALL"); }}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/8 text-gray-300 hover:text-white text-sm font-medium rounded-xl transition-all">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item: any) => {
              const tipCount   = getTipCount(item.id);
              const daysAgo    = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 86400000);
              const isFound    = !!item?.isFound;

              return (
                <div key={item.id}
                  className={`group relative bg-white/[0.03] rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col
                    ${isFound
                      ? "border-emerald-500/20 opacity-60"
                      : "border-white/5 hover:border-red-500/30 hover:bg-white/[0.05] hover:shadow-xl hover:shadow-red-950/30"
                    }`}>

                  {/* Image */}
                  <div className="relative h-52 overflow-hidden bg-white/[0.02]">
                    <img
                      src={item?.img || "/bgimg.png"}
                      alt={item?.lostItemName}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                    {/* Top-left badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {isFound ? (
                        <span className="px-2 py-0.5 bg-emerald-500/80 text-white text-[10px] font-bold rounded-md backdrop-blur-sm border border-emerald-400/30 uppercase tracking-wide">
                          ✓ Found
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-600/80 text-white text-[10px] font-bold rounded-md backdrop-blur-sm border border-red-400/30 uppercase tracking-wide">
                          Lost
                        </span>
                      )}
                    </div>

                    {/* Days badge top-right */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md backdrop-blur-sm border ${daysBadgeClass(daysAgo)}`}>
                        {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
                      </span>
                    </div>

                    {/* Tip count bottom-right */}
                    {tipCount > 0 && (
                      <div className="absolute bottom-3 right-3">
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-400/90 text-gray-950 text-[10px] font-bold rounded-md">
                          <FaLightbulb size={8} /> {tipCount} tip{tipCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}

                    {/* Category bottom-left */}
                    {item?.category?.name && (
                      <div className="absolute bottom-3 left-3">
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-black/50 text-gray-300 text-[10px] rounded-md backdrop-blur-sm border border-white/10">
                          <FaTag size={7} /> {item.category.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-white text-sm font-bold mb-1.5 line-clamp-1 group-hover:text-red-300 transition-colors">
                      {item?.lostItemName}
                    </h3>
                    <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed">{item?.description}</p>

                    {/* Meta */}
                    <div className="space-y-1.5 mt-auto mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FaMapMarkerAlt className="text-red-400/70 shrink-0" size={10} />
                        <span className="line-clamp-1">{item?.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FaCalendarAlt className="text-blue-400/70 shrink-0" size={10} />
                        <span>{item?.date?.split("T")[0]}</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/5 mb-3" />

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTipItem(item)}
                        disabled={isFound}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-500/8 hover:bg-amber-500/15 border border-amber-500/15 hover:border-amber-500/30 text-amber-400 hover:text-amber-300 text-xs font-semibold rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <FaLightbulb size={10} /> I Saw This
                      </button>

                      {tipCount > 0 && (
                        <button onClick={() => setViewTipsItem(item)}
                          className="w-10 h-10 flex items-center justify-center bg-cyan-500/8 hover:bg-cyan-500/15 border border-cyan-500/15 hover:border-cyan-500/30 text-cyan-400 rounded-xl transition-all shrink-0"
                          title={`${tipCount} tip${tipCount !== 1 ? "s" : ""}`}>
                          <FaEye size={12} />
                        </button>
                      )}

                      <Link to={`/lostItems/${item.id}`}
                        className="flex-1 flex items-center justify-center py-2.5 bg-white/[0.04] hover:bg-white/8 border border-white/8 hover:border-white/15 text-gray-400 hover:text-white text-xs font-medium rounded-xl transition-all">
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
        <div className="flex flex-col items-center mt-14 space-y-3">
          <p className="text-gray-600 text-xs">Page {currentPage} of {totalPages}</p>
          <nav className="inline-flex items-center gap-1 bg-white/[0.03] rounded-2xl p-1.5 border border-white/5">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="flex items-center px-4 py-2 text-sm font-medium rounded-xl text-gray-400 hover:text-white hover:bg-white/5 disabled:text-gray-700 disabled:cursor-not-allowed transition-all">
              <FaChevronLeft size={10} className="mr-1.5" /> Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setCurrentPage(p)}
                className={`w-9 h-9 text-sm font-bold rounded-xl transition-all ${
                  currentPage === p
                    ? "bg-red-600 text-white shadow-lg shadow-red-900/30"
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                }`}>
                {p}
              </button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="flex items-center px-4 py-2 text-sm font-medium rounded-xl text-gray-400 hover:text-white hover:bg-white/5 disabled:text-gray-700 disabled:cursor-not-allowed transition-all">
              Next <FaChevronRight size={10} className="ml-1.5" />
            </button>
          </nav>
        </div>
      )}

      {/* Modals */}
      {tipItem      && <TipModal        item={tipItem}      onClose={() => setTipItem(null)}      />}
      {viewTipsItem && <TipsViewerModal item={viewTipsItem} onClose={() => setViewTipsItem(null)} />}

      <ToastContainer position="top-right" autoClose={3000} theme="dark"
        toastClassName="!bg-gray-900 !border !border-white/10 !rounded-xl !text-sm !text-white shadow-2xl" />
    </div>
  );
};

export default BulletinBoard;