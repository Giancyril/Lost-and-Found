import { useState } from "react";
import {
  FaClipboardList, FaCheckCircle, FaTimesCircle,
  FaClock, FaSearch, FaEye, FaBoxOpen, FaMapMarkerAlt,
  FaTimes, FaUser,
} from "react-icons/fa";
import { useMyClaimsQuery } from "../../redux/api/api"; // Updated import

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const STATUS_TABS = [
  { label: "All",      value: "ALL"      },
  { label: "Pending",  value: "PENDING"  },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING:  "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  APPROVED: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  REJECTED: "bg-red-400/10 text-red-400 border-red-400/20",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:  <FaClock size={9} />,
  APPROVED: <FaCheckCircle size={9} />,
  REJECTED: <FaTimesCircle size={9} />,
};

export default function StudentClaims() {
  // RTK Query Hook replacement
  const { data, isLoading: loading } = useMyClaimsQuery(undefined);
  const claims = data?.data?.data ?? data?.data ?? [];

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected,     setSelected]     = useState<any>(null);

  const filtered = claims.filter((c: any) => {
    const name = c.foundItem?.foundItemName ?? c.lostItem?.lostItemName ?? "";
    const matchSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const total    = claims.length;
  const pending  = claims.filter((c: any) => c.status === "PENDING").length;
  const approved = claims.filter((c: any) => c.status === "APPROVED").length;
  const rejected = claims.filter((c: any) => c.status === "REJECTED").length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",    value: total,    icon: <FaClipboardList size={13} className="text-blue-400" />,   bg: "bg-blue-500/10",    accent: "text-white"       },
          { label: "Pending",  value: pending,  icon: <FaClock size={13} className="text-yellow-400" />,          bg: "bg-yellow-500/10",  accent: "text-yellow-400"  },
          { label: "Approved", value: approved, icon: <FaCheckCircle size={13} className="text-emerald-400" />,   bg: "bg-emerald-500/10", accent: "text-emerald-400" },
          { label: "Rejected", value: rejected, icon: <FaTimesCircle size={13} className="text-red-400" />,       bg: "bg-red-500/10",     accent: "text-red-400"     },
        ].map(({ label, value, icon, bg, accent }) => (
          <div key={label} className="bg-gray-900 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className={`text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
              <p className="text-gray-500 text-xs mt-0.5 font-medium">{label}</p>
            </div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>{icon}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
          <input
            type="text" placeholder="Search by item name..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/80 border border-white/10 rounded-2xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div className="flex gap-1 bg-gray-800/40 border border-white/10 rounded-2xl p-1 w-full sm:w-auto">
          {STATUS_TABS.map(({ label, value }) => (
            <button key={value} onClick={() => setStatusFilter(value)}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap focus:outline-none select-none border transition-all ${
                statusFilter === value
                  ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-900 border border-white/5 rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
              <div className="col-span-4">Item</div>
              <div className="col-span-3">Proof Submitted</div>
              <div className="col-span-2">Date Lost</div>
              <div className="col-span-2">Submitted</div>
              <div className="col-span-1 text-right">Status</div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-20 text-center">
                <FaClipboardList size={24} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No claims match your filters</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {filtered.map((claim: any, i: number) => {
                  const itemName = claim.foundItem?.foundItemName ?? claim.lostItem?.lostItemName ?? "Item";
                  const status   = claim.status ?? "PENDING";
                  return (
                    <div key={i} className="grid grid-cols-12 gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <img
                          src={claim.foundItem?.img || "/default-item.png"} alt=""
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/5"
                        />
                        <div className="min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{itemName}</p>
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                            {claim.foundItem?.category?.name ?? "—"}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <p className="text-gray-400 text-xs line-clamp-2">
                          {claim.distinguishingFeatures || <span className="text-gray-600 italic">None provided</span>}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500 text-xs">{claim.lostDate ? fmt(claim.lostDate) : "—"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500 text-xs">{claim.createdAt ? fmt(claim.createdAt) : "—"}</p>
                      </div>
                      <div className="col-span-1 flex items-center justify-end gap-2">
                        <button onClick={() => setSelected(claim)}
                          className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                          <FaEye size={11} />
                        </button>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE[status] ?? STATUS_BADGE.PENDING}`}>
                          {STATUS_ICON[status]} {status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.length === 0 ? (
              <div className="py-16 text-center bg-gray-900 border border-white/5 rounded-2xl">
                <FaClipboardList size={22} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No claims match your filters</p>
              </div>
            ) : filtered.map((claim: any, i: number) => {
              const itemName = claim.foundItem?.foundItemName ?? claim.lostItem?.lostItemName ?? "Item";
              const status   = claim.status ?? "PENDING";
              return (
                <div key={i} className="bg-gray-900 border border-white/5 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <img src={claim.foundItem?.img || "/default-item.png"} alt=""
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white font-semibold text-sm truncate">{itemName}</p>
                        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE[status] ?? STATUS_BADGE.PENDING}`}>
                          {STATUS_ICON[status]} {status}
                        </span>
                      </div>
                      {claim.foundItem?.category?.name && (
                        <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                          {claim.foundItem.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/5">
                    <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Date Lost</p><p className="text-gray-300 mt-0.5">{claim.lostDate ? fmt(claim.lostDate) : "—"}</p></div>
                    <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Submitted</p><p className="text-gray-300 mt-0.5">{claim.createdAt ? fmt(claim.createdAt) : "—"}</p></div>
                  </div>
                  {claim.distinguishingFeatures && (
                    <p className="text-gray-500 text-xs italic line-clamp-2 border-t border-white/5 pt-2">
                      "{claim.distinguishingFeatures}"
                    </p>
                  )}
                  <button onClick={() => setSelected(claim)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 rounded-xl text-xs font-medium transition-colors">
                    <FaEye size={10} /> View Details
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <FaClipboardList size={11} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Claim Details</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Your submitted claim</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_BADGE[selected.status] ?? STATUS_BADGE.PENDING}`}>
                  {STATUS_ICON[selected.status]} {selected.status}
                </span>
                <button onClick={() => setSelected(null)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.07] flex items-center justify-center text-gray-500 hover:text-white transition-colors">
                  <FaTimes size={11} />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.05]">
                  <FaBoxOpen size={9} className="text-cyan-400" />
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Item Being Claimed</p>
                </div>
                <div className="flex gap-3 p-3">
                  <img src={selected.foundItem?.img || "/default-item.png"} alt=""
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10" />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-bold">{selected.foundItem?.foundItemName ?? "—"}</p>
                    {selected.foundItem?.location && (
                      <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                        <FaMapMarkerAlt size={8} className="text-blue-400" /> {selected.foundItem.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.05]">
                  <FaUser size={9} className="text-emerald-400" />
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Your Proof</p>
                </div>
                <div className="p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Date Lost</p><p className="text-gray-300 mt-0.5">{selected.lostDate ? fmt(selected.lostDate) : "—"}</p></div>
                    <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Submitted</p><p className="text-gray-300 mt-0.5">{selected.createdAt ? fmt(selected.createdAt) : "—"}</p></div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-[10px] uppercase tracking-widest mb-1">Distinguishing Features</p>
                    <p className="text-gray-200 text-sm leading-relaxed">
                      {selected.distinguishingFeatures || <span className="text-gray-500 italic text-xs">None provided</span>}
                    </p>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-white/[0.04] text-gray-400 border border-white/[0.07] hover:text-gray-200 hover:bg-white/[0.07] transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}