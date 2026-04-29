import { useEffect, useState } from "react";
import {
  FaBoxOpen, FaMapMarkerAlt, FaCalendarAlt,
  FaCheckCircle, FaClock, FaSearch, FaChevronDown, FaCheck,
} from "react-icons/fa";

const API = "/api";
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
  "Content-Type": "application/json",
});
const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const STATUS_TABS = [
  { label: "All",       value: "ALL"       },
  { label: "Unclaimed", value: "UNCLAIMED" },
  { label: "Claimed",   value: "CLAIMED"   },
];

export default function StudentFoundItems() {
  const [items,        setItems]        = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetch(`${API}/my/foundItem`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setItems(d?.data?.data ?? d?.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(item => {
    const matchSearch = item.foundItemName?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "CLAIMED"   &&  item.isClaimed) ||
      (statusFilter === "UNCLAIMED" && !item.isClaimed);
    return matchSearch && matchStatus;
  });

  const total     = items.length;
  const claimed   = items.filter(i => i.isClaimed).length;
  const unclaimed = items.filter(i => !i.isClaimed).length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-white font-black text-xl tracking-tight">My Found Items</h1>
        <p className="text-gray-500 text-sm mt-0.5">Items you reported as found on campus</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Reported", value: total,     icon: <FaBoxOpen size={14} className="text-cyan-400" />,    accent: "bg-cyan-500/5",    sub: "all time",          subColor: "text-gray-500"    },
          { label: "Unclaimed",      value: unclaimed,  icon: <FaClock size={14} className="text-yellow-400" />,   accent: "bg-yellow-500/5",  sub: "awaiting claim",    subColor: "text-yellow-400"  },
          { label: "Claimed",        value: claimed,    icon: <FaCheckCircle size={14} className="text-emerald-400" />, accent: "bg-emerald-500/5", sub: "successfully claimed", subColor: "text-emerald-400" },
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

      {/* Filters */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full group">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={12} />
          <input
            type="text" placeholder="Search found items..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/80 border border-white/10 rounded-2xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
        </div>
        <div className="flex gap-1 bg-gray-800/40 border border-white/10 rounded-2xl p-1 w-full sm:w-auto">
          {STATUS_TABS.map(({ label, value }) => (
            <button key={value} onClick={() => setStatusFilter(value)}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap focus:outline-none select-none border transition-all ${
                statusFilter === value
                  ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-900 border border-white/5 rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
              <div className="col-span-4">Item</div>
              <div className="col-span-3">Location</div>
              <div className="col-span-2">Date Found</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-1 text-right">Status</div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-20 text-center">
                <FaSearch size={24} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No found items match your filters</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {filtered.map((item: any, i: number) => (
                  <div key={i} className="grid grid-cols-12 gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      {item.img
                        ? <img src={item.img} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10" />
                        : <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center shrink-0"><FaBoxOpen size={14} className="text-cyan-400" /></div>
                      }
                      <div className="min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{item.foundItemName}</p>
                        <p className="text-gray-500 text-xs truncate mt-0.5">{item.description}</p>
                      </div>
                    </div>
                    <div className="col-span-3 flex items-center gap-1 text-gray-400 text-xs min-w-0">
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
                    <div className="col-span-1 flex justify-end">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.isClaimed
                          ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                          : "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
                      }`}>
                        {item.isClaimed ? <FaCheckCircle size={8} /> : <FaClock size={8} />}
                        {item.isClaimed ? "Claimed" : "Active"}
                      </span>
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
                <p className="text-gray-500 text-sm">No found items match your filters</p>
              </div>
            ) : filtered.map((item: any, i: number) => (
              <div key={i} className="bg-gray-900 border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {item.img
                      ? <img src={item.img} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10" />
                      : <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center shrink-0"><FaBoxOpen size={16} className="text-cyan-400" /></div>
                    }
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{item.foundItemName}</p>
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{item.description}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    item.isClaimed
                      ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                      : "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
                  }`}>
                    {item.isClaimed ? "Claimed" : "Active"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/5">
                  <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Location</p><p className="text-gray-300 mt-0.5 truncate">{item.location || "—"}</p></div>
                  <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Date Found</p><p className="text-gray-300 mt-0.5">{item.date ? fmt(item.date) : "—"}</p></div>
                  <div><p className="text-gray-600 text-[10px] uppercase tracking-widest">Category</p><p className="text-gray-300 mt-0.5">{item.category?.name || "—"}</p></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}