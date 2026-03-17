import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaFilter,
  FaLightbulb, FaTimes, FaChevronLeft, FaChevronRight,
  FaExclamationTriangle, FaCheckCircle,
  FaEye, FaTag, FaWallet, FaMobileAlt, FaLaptop, FaKey,
  FaBriefcase, FaHeadphones, FaGlasses, FaBook, FaIdCard,
  FaUmbrella, FaTshirt, FaCamera, FaClock, FaTint, FaTrash,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useGetLostItemsQuery, useCategoryQuery } from "../../redux/api/api";
import { useUserVerification } from "../../auth/auth";

// ── Category icon resolver ────────────────────────────────────────────────────
const getCategoryIcon = (name: string) => {
  const n = name?.toLowerCase() ?? "";
  if (n.includes("wallet") || n.includes("purse") || n.includes("pouch"))
    return <FaWallet size={9} className="text-amber-400" />;
  if (n.includes("phone") || n.includes("mobile") || n.includes("celphone") || n.includes("cellphone"))
    return <FaMobileAlt size={9} className="text-cyan-400" />;
  if (n.includes("laptop") || n.includes("computer") || n.includes("electronic") || n.includes("device") || n.includes("gadget"))
    return <FaLaptop size={9} className="text-indigo-400" />;
  if (n.includes("key"))
    return <FaKey size={9} className="text-orange-400" />;
  if (n.includes("bag") || n.includes("backpack") || n.includes("luggage"))
    return <FaBriefcase size={9} className="text-amber-400" />;
  if (n.includes("headphone") || n.includes("earphone") || n.includes("audio") || n.includes("airpod"))
    return <FaHeadphones size={9} className="text-green-400" />;
  if (n.includes("glass") || n.includes("spectacle") || n.includes("eyewear") || n.includes("sunglass"))
    return <FaGlasses size={9} className="text-teal-400" />;
  if (n.includes("book") || n.includes("stationery") || n.includes("notebook"))
    return <FaBook size={9} className="text-yellow-400" />;
  if (n.includes("id") || n.includes("card") || n.includes("document"))
    return <FaIdCard size={9} className="text-blue-400" />;
  if (n.includes("umbrella"))
    return <FaUmbrella size={9} className="text-blue-400" />;
  if (n.includes("cloth") || n.includes("shirt") || n.includes("uniform") || n.includes("wear"))
    return <FaTshirt size={9} className="text-purple-400" />;
  if (n.includes("camera") || n.includes("photo"))
    return <FaCamera size={9} className="text-violet-400" />;
  if (n.includes("watch") || n.includes("clock"))
    return <FaClock size={9} className="text-gray-300" />;
  if (n.includes("water") || n.includes("bottle") || n.includes("tumbler") || n.includes("flask"))
    return <FaTint size={9} className="text-cyan-400" />;
  return <FaTag size={9} className="text-blue-400" />;
};

// ── Tip storage helpers ───────────────────────────────────────────────────────
const saveTipLocally = (lostItemId: string, tip: { location: string; details: string; time: string }) => {
  try {
    const existing = JSON.parse(localStorage.getItem("bulletin_tips") || "{}");
    if (!existing[lostItemId]) existing[lostItemId] = [];
    existing[lostItemId].push(tip);
    localStorage.setItem("bulletin_tips", JSON.stringify(existing));
  } catch {}
};

const getTipsForItem = (lostItemId: string): { location: string; details: string; time: string }[] => {
  try {
    const existing = JSON.parse(localStorage.getItem("bulletin_tips") || "{}");
    return existing[lostItemId] || [];
  } catch { return []; }
};

const deleteTipLocally = (lostItemId: string, index: number): { location: string; details: string; time: string }[] => {
  try {
    const existing = JSON.parse(localStorage.getItem("bulletin_tips") || "{}");
    if (existing[lostItemId]) {
      existing[lostItemId].splice(index, 1);
      localStorage.setItem("bulletin_tips", JSON.stringify(existing));
      return existing[lostItemId];
    }
    return [];
  } catch { return []; }
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ── Tip Modal ──────────────────────────────────────────────────────────────────
const TipModal = ({ item, onClose }: { item: any; onClose: () => void }) => {
  const [location, setLocation]   = useState("");
  const [details, setDetails]     = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;
    saveTipLocally(item.id, {
      location: location.trim() || "Location not specified",
      details:  details.trim(),
      time:     new Date().toISOString(),
    });
    setSubmitted(true);
    toast.success("Your tip has been submitted anonymously!");
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-800 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <FaLightbulb className="text-blue-400" size={14} /> Submit a Tip
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">Your tip is completely anonymous</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1 transition-colors">
            <FaTimes size={15} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-3 mb-5 border border-gray-700">
            <img
              src={item?.img || "/bgimg.png"}
              alt={item?.lostItemName}
              onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
              className="w-12 h-12 rounded-lg object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{item?.lostItemName}</p>
              <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
                <FaMapMarkerAlt size={9} /> {item?.location}
              </p>
            </div>
            <span className="shrink-0 px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full border border-red-500/20">Lost</span>
          </div>

          {submitted ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <FaCheckCircle className="text-emerald-400" size={24} />
              </div>
              <p className="text-white font-semibold">Tip Submitted!</p>
              <p className="text-gray-500 text-xs mt-1">Thank you for helping reunite lost items</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-widest mb-1.5">
                  Where did you see it? <span className="text-gray-500 font-normal normal-case tracking-normal">(optional)</span>
                </label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Room 205, Library, Canteen..."
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/40 focus:border-yellow-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-widest mb-1.5">
                  What did you see? <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  rows={4}
                  required
                  minLength={10}
                  placeholder="Describe what you saw, when, and any other helpful details..."
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500/40 focus:border-yellow-500/40"
                />
                <p className="text-gray-600 text-[10px] mt-1">{details.length} / min. 10 characters</p>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3">
                <p className="text-blue-300/80 text-xs leading-relaxed">
                  Your tip is submitted <strong>completely anonymously</strong>. No personal information is collected or stored.
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={details.trim().length < 10}
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                  Submit Tip
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Tips Viewer Modal ──────────────────────────────────────────────────────────
const TipsViewerModal = ({ item, onClose, isAdmin }: { item: any; onClose: () => void; isAdmin?: boolean }) => {
  const [tips, setTips] = useState(() => getTipsForItem(item.id));
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);

  const handleDeleteTip = (index: number) => {
    const updated = deleteTipLocally(item.id, index);
    setTips([...updated]);
    setConfirmDeleteIdx(null);
    toast.success("Tip removed successfully");
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-800 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
          <div>
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <FaEye className="text-cyan-400" size={14} /> Community Tips
              {isAdmin && (
                <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full font-semibold">
                  Admin
                </span>
              )}
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">
              {item?.lostItemName} · {tips.length} {tips.length === 1 ? "tip" : "tips"}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1 transition-colors">
            <FaTimes size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tips.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                <FaEye className="text-cyan-400 opacity-40" size={22} />
              </div>
              <p className="text-white text-sm font-semibold">No tips yet</p>
              <p className="text-gray-500 text-xs mt-1.5 leading-relaxed max-w-xs mx-auto">
                No one has submitted a tip for this item yet. If you've seen it, click{" "}
                <strong className="text-blue-400">"I Saw This"</strong> to help!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tips.map((tip, i) => (
                <div key={i} className="bg-gray-800/60 border border-white/5 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                    <FaMapMarkerAlt size={10} className="text-orange-400 shrink-0" />
                    <span className="text-orange-300 text-xs font-medium truncate">{tip.location}</span>
                    <span className="text-gray-600 text-[10px] ml-auto shrink-0">{timeAgo(tip.time)}</span>
                    {isAdmin && (
                      confirmDeleteIdx === i ? (
                        <div className="flex items-center gap-1 ml-1 shrink-0">
                          <button
                            onClick={() => handleDeleteTip(i)}
                            className="flex items-center gap-1 px-2 py-0.5 bg-red-500 hover:bg-red-400 text-white text-[10px] font-semibold rounded-lg transition-all"
                          >
                            <FaTrash size={8} /> Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteIdx(null)}
                            className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] font-medium rounded-lg transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteIdx(i)}
                          title="Delete tip"
                          className="ml-1 w-6 h-6 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-400 hover:text-white transition-all shrink-0"
                        >
                          <FaTrash size={9} />
                        </button>
                      )
                    )}
                  </div>
                  <div className="px-4 pb-3">
                    <p className="text-gray-300 text-sm leading-relaxed">{tip.details}</p>
                    <p className="text-gray-600 text-[10px] mt-2">Anonymous tip</p>
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

// ── Main Bulletin Board Page ───────────────────────────────────────────────────
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

  const users: any = useUserVerification();
  const isAdmin    = users?.role === "ADMIN";

  const { data: lostItems, isLoading } = useGetLostItemsQuery({
    searchTerm,
    page: currentPage,
    limit,
    sortBy,
    sortOrder,
  });

  const { data: categoriesData } = useCategoryQuery("");

  const handleFuzzyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFuzzyTerm(v);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => { setSearchTerm(v); setCurrentPage(1); }, 400);
  };

  const clearSearch = () => { setFuzzyTerm(""); setSearchTerm(""); setCurrentPage(1); };

  const filteredItems = categoryFilter === "ALL"
    ? lostItems?.data ?? []
    : (lostItems?.data ?? []).filter((i: any) =>
        i?.category?.name?.toLowerCase() === categoryFilter.toLowerCase()
      );

  const totalPages = lostItems?.meta?.totalPage || 1;
  const getTipCount = (id: string) => getTipsForItem(id).length;

  return (
    // ── Single flat bg-gray-950, identical to AiSearch ────────────────────────
    <div className="min-h-screen bg-gray-950 relative overflow-x-hidden pb-16">

      {/* Fixed ambient glow orbs — same as AiSearch, covers whole page */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-20 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative z-10 px-6 sm:px-10 lg:px-16 pt-16 pb-12 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-semibold mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <FaExclamationTriangle size={10} /> Community Bulletin Board
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight mb-4 max-w-2xl">
          Lost Items{" "}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
            Bulletin Board
          </span>
        </h1>

        <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full mb-5" />

        <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-7 max-w-xl">
          Help reunite students with their lost belongings. If you've seen any of these items, submit an anonymous tip — no account needed.
        </p>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400">
            <FaLightbulb className="text-yellow-400" size={11} />
            <span>Anonymous tips welcome</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400">
            <FaCheckCircle className="text-emerald-400" size={11} />
            <span>No login required</span>
          </div>
        </div>
      </div>

      {/* ── Search & filters ─────────────────────────────────────────────────── */}
      <div className="relative z-10 px-6 sm:px-10 lg:px-16 pb-6">
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-black/40">
          <div className="mb-4">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
              <input
                type="search"
                value={fuzzyTerm}
                onChange={handleFuzzyChange}
                placeholder="Search lost items by name, location, or description..."
                className="w-full pl-11 pr-4 py-3 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
              />
              {fuzzyTerm && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white px-2 py-1 text-xs transition-colors">
                  ✕ Clear
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-white/5 pt-3">
            <FaFilter className="text-gray-600 shrink-0 hidden sm:block" size={12} />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={e => {
                const [f, o] = e.target.value.split("-");
                setSortBy(f); setSortOrder(o); setCurrentPage(1);
              }}
              className="flex-1 min-w-0 p-2.5 text-sm text-white border border-white/10 rounded-xl bg-white/5 focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
            >
              <option value="date-desc" className="bg-gray-900">Date Lost (Newest)</option>
              <option value="date-asc"  className="bg-gray-900">Date Lost (Oldest)</option>
              <option value="lostItemName-asc"  className="bg-gray-900">Name (A-Z)</option>
              <option value="lostItemName-desc" className="bg-gray-900">Name (Z-A)</option>
            </select>
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="flex-1 min-w-0 p-2.5 text-sm text-white border border-white/10 rounded-xl bg-white/5 focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
            >
              <option value="ALL" className="bg-gray-900">All Categories</option>
              {categoriesData?.data?.map((cat: any) => (
                <option key={cat.id} value={cat.name} className="bg-gray-900">{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Cards grid ───────────────────────────────────────────────────────── */}
      <div className="relative z-10 px-6 sm:px-10 lg:px-16">
        {isLoading ? (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl overflow-hidden border border-white/5 animate-pulse">
                <div className="h-48 bg-gray-800" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-800 rounded" />
                  <div className="h-3 bg-gray-800 rounded w-3/4" />
                  <div className="h-8 bg-gray-800 rounded mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-900 border border-white/5 flex items-center justify-center mx-auto mb-4">
              <FaSearch className="text-gray-600 text-2xl" />
            </div>
            <p className="text-white font-semibold mb-2">No lost items found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
            {(fuzzyTerm || categoryFilter !== "ALL") && (
              <button onClick={() => { clearSearch(); setCategoryFilter("ALL"); }}
                className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item: any) => {
              const tipCount    = getTipCount(item.id);
              const daysAgoLost = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={item.id}
                  className="group bg-gray-900 rounded-xl overflow-hidden border border-white/5 hover:border-blue-500/40 hover:shadow-xl hover:shadow-black/40 transition-all duration-200 flex flex-col">

                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={item?.img || "/bgimg.png"}
                      alt={item?.lostItemName}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-red-600/90 text-white text-[10px] font-bold rounded-full backdrop-blur-sm border border-red-500/40">
                        Lost
                      </span>
                      {item?.isFound && (
                        <span className="px-2 py-0.5 bg-emerald-600/90 text-white text-[10px] font-bold rounded-full backdrop-blur-sm border border-emerald-500/40">
                          Found!
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full backdrop-blur-sm border ${
                        daysAgoLost > 30 ? "bg-orange-500/80 text-white border-orange-400/40" :
                        daysAgoLost > 7  ? "bg-yellow-500/80 text-gray-900 border-yellow-400/40" :
                                           "bg-white/10 text-white border-white/20"
                      }`}>
                        {daysAgoLost === 0 ? "Today" : `${daysAgoLost}d ago`}
                      </span>
                    </div>

                    {tipCount > 0 && (
                      <div className="absolute bottom-3 right-3">
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/90 text-gray-900 text-[10px] font-bold rounded-full">
                          <FaLightbulb size={8} /> {tipCount} tip{tipCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-white text-sm font-bold mb-1 line-clamp-1 group-hover:text-blue-400 transition-colors">
                      {item?.lostItemName}
                    </h3>
                    <p className="text-gray-500 text-xs mb-3 line-clamp-2 leading-relaxed">{item?.description}</p>

                    <div className="space-y-1.5 mt-auto mb-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FaMapMarkerAlt size={9} className="text-gray-600 shrink-0" />
                        <span className="line-clamp-1">{item?.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FaCalendarAlt size={9} className="text-gray-600 shrink-0" />
                        <span>{item?.date?.split("T")[0]}</span>
                      </div>
                      {item?.category?.name && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="text-gray-600 shrink-0">{getCategoryIcon(item.category.name)}</span>
                          <span>{item.category.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => setTipItem(item)}
                        disabled={!!item?.isFound}
                        className="flex items-center justify-center gap-1.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <FaLightbulb size={10} /> I Saw This
                      </button>
                      <button
                        onClick={() => setViewTipsItem(item)}
                        className="flex items-center justify-center gap-1 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-medium rounded-xl transition-all"
                        title={tipCount > 0 ? `${tipCount} tip${tipCount !== 1 ? "s" : ""}` : "No tips yet"}
                      >
                        <FaEye size={9} />
                        <span className="text-[10px]">{tipCount}</span>
                      </button>
                      <Link to={`/lostItems/${item.id}`}
                        className="flex items-center justify-center py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white text-xs font-medium rounded-xl transition-all">
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

      {/* ── Pagination ───────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="relative z-10 flex flex-col items-center mt-12 space-y-3">
          <p className="text-gray-500 text-sm">Page {currentPage} of {totalPages}</p>
          <nav className="inline-flex items-center gap-1 bg-gray-900 rounded-2xl p-2 border border-white/10">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="flex items-center px-4 py-2 text-sm font-medium rounded-xl text-gray-300 bg-white/5 hover:bg-white/10 disabled:text-gray-600 disabled:cursor-not-allowed transition-all">
              <FaChevronLeft size={11} className="mr-1.5" /> Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setCurrentPage(p)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  currentPage === p ? "bg-blue-600 text-white" : "text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white"
                }`}>
                {p}
              </button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="flex items-center px-4 py-2 text-sm font-medium rounded-xl text-gray-300 bg-white/5 hover:bg-white/10 disabled:text-gray-600 disabled:cursor-not-allowed transition-all">
              Next <FaChevronRight size={11} className="ml-1.5" />
            </button>
          </nav>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {tipItem && (
        <TipModal item={tipItem} onClose={() => setTipItem(null)} />
      )}
      {viewTipsItem && (
        <TipsViewerModal
          item={viewTipsItem}
          onClose={() => setViewTipsItem(null)}
          isAdmin={isAdmin}
        />
      )}

      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
  );
};

export default BulletinBoard;