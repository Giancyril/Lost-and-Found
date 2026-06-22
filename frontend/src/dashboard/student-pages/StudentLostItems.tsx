import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FaSearch, FaMapMarkerAlt,
  FaCheckCircle, FaClock, FaBoxOpen, FaTimes,
} from "react-icons/fa";
import { IoMdRadioButtonOn } from "react-icons/io";
import { useGetMyLostItemQuery } from "../../redux/api/api";
import { useUserVerification } from "../../auth/auth";
import placeholderImg from "../../assets/3576506_65968.jpg";
import StatusTimeline, { getCurrentStatusText } from "../../components/timeline/StatusTimeline";

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

export default function StudentLostItems() {
  const user = useUserVerification();
  const isLoggedIn = !!user?.id;
  const { data, isLoading: loading } = useGetMyLostItemQuery(undefined, { skip: !isLoggedIn });
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingItem, setTrackingItem]: any = useState(null);

  const scrollEl = () => document.querySelector("main") as HTMLElement | null;

  const openTrackingModal = (item: any) => {
    const el = scrollEl();
    if (el) el.style.overflow = "hidden";
    setTrackingItem(item);
    setIsTrackingOpen(true);
  };

  const closeTrackingModal = () => {
    const el = scrollEl();
    if (el) el.style.overflow = "";
    setIsTrackingOpen(false);
  };

  useEffect(() => {
    return () => {
      const el = scrollEl();
      if (el) el.style.overflow = "";
    };
  }, []);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40";
      case "Claim Approved":
        return "bg-green-950/40 border border-green-500/50 text-green-400 hover:bg-green-900/40";
      case "Matched":
        return "bg-cyan-950/40 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-900/40";
      case "Under Review":
      default:
        return "bg-yellow-950/40 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-900/40";
    }
  };

  // Backend getMyLostItem returns a plain array wrapped in sendResponse as data.data
  // ❌ was: data?.data?.data ?? data?.data ?? []  (double-unwrap, always empty)
  // ✅ fix: data?.data ?? []
  const items: any[] = data?.data ?? [];

  const [search, setSearch] = useState("");

  const filtered = items.filter((item: any) =>
    item.lostItemName?.toLowerCase().includes(search.toLowerCase()) ||
    item.description?.toLowerCase().includes(search.toLowerCase())
  );

  const total = items.length;
  const active = items.filter((i: any) => !i.isFound).length;
  const resolved = items.filter((i: any) => i.isFound).length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Reports", value: total, icon: <FaSearch size={14} className="text-red-400" />, accent: "bg-red-500/5", sub: "all time", subColor: "text-gray-500" },
          { label: "Active", value: active, icon: <IoMdRadioButtonOn size={14} className="text-orange-400" />, accent: "bg-orange-500/5", sub: "still missing", subColor: "text-orange-400" },
          { label: "Resolved", value: resolved, icon: <FaCheckCircle size={14} className="text-emerald-400" />, accent: "bg-emerald-500/5", sub: "marked as found", subColor: "text-emerald-400" },
        ].map(({ label, value, icon, accent, sub, subColor }) => (
          <div key={label} className="relative bg-gray-900 border border-white/5 rounded-2xl p-3 flex flex-col gap-2 overflow-hidden">
            <div className={`absolute inset-0 opacity-30 ${accent} blur-3xl scale-150 pointer-events-none`} />
            <div className="relative">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent}`}>{icon}</div>
            </div>
            <div className="relative">
              <p className="text-xl font-bold text-white tracking-tight">{value}</p>
              <p className="text-gray-500 text-[11px] mt-0.5 font-medium">{label}</p>
              <p className={`text-[10px] mt-1 font-medium ${subColor}`}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4">
        <div className="relative flex-1 w-full group">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors" size={12} />
          <input
            type="text" placeholder="Search lost items..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/80 border border-white/10 rounded-2xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-900 border border-white/5 rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
              <div className="col-span-4">Item</div>
              <div className="col-span-2">Location</div>
              <div className="col-span-2">Date Lost</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-20 text-center">
                <FaSearch size={24} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {items.length === 0 ? "You haven't reported any lost items yet" : "No lost items match your search"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {filtered.map((item: any, i: number) => (
                  <div key={item.id ?? i} className="grid grid-cols-12 gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      {item.img
                        ? <img src={item.img} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        : <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center shrink-0"><FaSearch size={12} className="text-red-400" /></div>
                      }
                      <div className="min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{item.lostItemName}</p>
                        <p className="text-gray-500 text-xs truncate mt-0.5">{item.description}</p>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center gap-1 text-gray-400 text-xs min-w-0">
                      <FaMapMarkerAlt size={9} className="text-blue-400 shrink-0" />
                      <span className="truncate">{item.location || "—"}</span>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500 text-xs">{item.date ? fmt(item.date) : "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs px-2 py-0.5 bg-white/5 border border-white/5 text-gray-300 rounded-lg">
                        {item.category?.name || "—"}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button
                        onClick={() => openTrackingModal(item)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap focus:outline-none focus:ring-0 ${getStatusBadgeStyle(
                          getCurrentStatusText(item, "lost")
                        )}`}
                        title="Click to track report status"
                      >
                        {getCurrentStatusText(item, "lost")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.length === 0 ? (
              <div className="py-16 text-center bg-gray-900 border border-white/5 rounded-2xl">
                <FaSearch size={22} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {items.length === 0 ? "You haven't reported any lost items yet" : "No lost items match your search"}
                </p>
              </div>
            ) : filtered.map((item: any, i: number) => (
              <div key={item.id ?? i} className="bg-gray-900 border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {item.img
                      ? <img src={item.img} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      : <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center shrink-0"><FaSearch size={14} className="text-red-400" /></div>
                    }
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{item.lostItemName}</p>
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{item.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openTrackingModal(item)}
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap focus:outline-none focus:ring-0 ${getStatusBadgeStyle(
                      getCurrentStatusText(item, "lost")
                    )}`}
                    title="Click to track report status"
                  >
                    {getCurrentStatusText(item, "lost")}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/5">
                  <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Location</p><p className="text-gray-300 mt-0.5 truncate">{item.location || "—"}</p></div>
                  <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Date Lost</p><p className="text-gray-300 mt-0.5">{item.date ? fmt(item.date) : "—"}</p></div>
                  <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Category</p><p className="text-gray-300 mt-0.5">{item.category?.name || "—"}</p></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tracking Timeline Modal — custom portal, no Flowbite overflow manipulation */}
      {isTrackingOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            onClick={closeTrackingModal}
          />
          {/* Panel */}
          <div className="relative z-10 w-full max-w-lg bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 shadow-2xl flex flex-col max-h-[88vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 shrink-0">
              <span className="text-xl font-bold text-white">Report Status Timeline</span>
              <button
                onClick={closeTrackingModal}
                className="text-gray-400 hover:text-white transition-colors p-1"
                aria-label="Close"
              >
                <FaTimes size={14} />
              </button>
            </div>
            {/* Scrollable body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {trackingItem && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-gray-900/50 p-4 border border-gray-800 rounded-xl">
                    {trackingItem?.img ? (
                      <img
                        className="w-16 h-16 rounded-xl object-cover border border-gray-700 shrink-0"
                        src={trackingItem.img}
                        alt=""
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = placeholderImg;
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center shrink-0">
                        <FaSearch size={20} className="text-red-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-base truncate">{trackingItem?.lostItemName}</h4>
                      <p className="text-gray-400 text-xs mt-1 truncate">{trackingItem?.description || "No description provided."}</p>
                      <div className="text-[10px] text-gray-500 font-semibold mt-2">
                        Location: {trackingItem?.location}
                      </div>
                    </div>
                  </div>

                  <StatusTimeline item={trackingItem} type="lost" />
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}