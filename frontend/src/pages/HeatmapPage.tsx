import { useState } from "react";
import { useGetLocationStatsQuery } from "../redux/api/api";
import { FaMapMarkedAlt, FaSearch, FaBoxOpen, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";

type Filter = "all" | "found" | "lost";

const HeatmapPage = () => {
  const { data, isLoading } = useGetLocationStatsQuery({});
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const raw: { location: string; found: number; lost: number; total: number }[] =
    data?.data ?? [];

  const filtered = raw
    .filter((r) => r.location.toLowerCase().includes(search.toLowerCase()))
    .filter((r) => {
      if (filter === "found") return r.found > 0;
      if (filter === "lost")  return r.lost > 0;
      return true;
    });

  const maxTotal = Math.max(...filtered.map((r) => r.total), 1);

  // heat color based on intensity
  const heatColor = (val: number, max: number) => {
    const pct = val / max;
    if (pct >= 0.75) return { bar: "bg-red-500",    badge: "bg-red-500/10 text-red-400 border-red-500/20",    label: "Hot" };
    if (pct >= 0.5)  return { bar: "bg-orange-400", badge: "bg-orange-400/10 text-orange-400 border-orange-400/20", label: "Warm" };
    if (pct >= 0.25) return { bar: "bg-yellow-400", badge: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20", label: "Mild" };
    return              { bar: "bg-cyan-500",    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",    label: "Low" };
  };

  const totals = raw.reduce(
    (acc, r) => ({ found: acc.found + r.found, lost: acc.lost + r.lost, total: acc.total + r.total }),
    { found: 0, lost: 0, total: 0 }
  );

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse max-w-5xl mx-auto">
        <div className="h-20 bg-gray-800/60 rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-800/60 rounded-2xl" />)}
        </div>
        {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-800/60 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="relative bg-gray-900 border border-white/5 rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
            <FaMapMarkedAlt size={20} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-white text-lg font-bold tracking-tight">Location Heatmap</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              Areas ranked by frequency of lost & found item reports · {raw.length} unique locations
            </p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Reports", value: totals.total, icon: <FaMapMarkedAlt size={15} className="text-cyan-400" />, color: "text-cyan-400", bg: "bg-cyan-500/10" },
          { label: "Found Items",   value: totals.found, icon: <FaBoxOpen size={15} className="text-emerald-400" />,   color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Lost Items",    value: totals.lost,  icon: <FaExclamationTriangle size={15} className="text-red-400" />, color: "text-red-400", bg: "bg-red-500/10" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} shrink-0`}>
              {s.icon}
            </div>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <FaSearch size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search location..."
            className="w-full bg-gray-900 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-colors"
          />
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-900 border border-white/5 rounded-xl p-1">
          {(["all", "found", "lost"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === f
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap list */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[11px] uppercase tracking-widest text-gray-600 font-medium">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-4">Location</div>
          <div className="col-span-4">Frequency</div>
          <div className="col-span-1 text-center">Found</div>
          <div className="col-span-1 text-center">Lost</div>
          <div className="col-span-1 text-center">Heat</div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <FaMapMarkedAlt size={28} className="mb-3 opacity-40" />
            <p className="text-sm">No locations found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((row, idx) => {
              const heat = heatColor(row.total, maxTotal);
              const pct  = Math.round((row.total / maxTotal) * 100);
              return (
                <div key={row.location} className="grid grid-cols-12 gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                  {/* Rank */}
                  <div className="col-span-1 text-center">
                    {idx === 0 ? (
                      <span className="text-lg">🔥</span>
                    ) : (
                      <span className="text-gray-600 text-sm font-mono">{idx + 1}</span>
                    )}
                  </div>

                  {/* Location name */}
                  <div className="col-span-4">
                    <p className="text-white text-sm font-medium truncate group-hover:text-cyan-400 transition-colors">
                      {row.location}
                    </p>
                    <p className="text-gray-600 text-[11px] mt-0.5">{row.total} report{row.total !== 1 ? "s" : ""}</p>
                  </div>

                  {/* Bar */}
                  <div className="col-span-4 flex items-center gap-2">
                    <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-700 ${heat.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-gray-500 text-[11px] w-8 text-right shrink-0">{pct}%</span>
                  </div>

                  {/* Found count */}
                  <div className="col-span-1 text-center">
                    {row.found > 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                        <FaCheckCircle size={9} /> {row.found}
                      </span>
                    ) : (
                      <span className="text-gray-700 text-xs">—</span>
                    )}
                  </div>

                  {/* Lost count */}
                  <div className="col-span-1 text-center">
                    {row.lost > 0 ? (
                      <span className="inline-flex items-center gap-1 text-red-400 text-xs font-semibold">
                        <FaExclamationTriangle size={9} /> {row.lost}
                      </span>
                    ) : (
                      <span className="text-gray-700 text-xs">—</span>
                    )}
                  </div>

                  {/* Heat badge */}
                  <div className="col-span-1 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${heat.badge}`}>
                      {heat.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-end">
        {[
          { label: "Hot (≥75%)",  bar: "bg-red-500"    },
          { label: "Warm (≥50%)", bar: "bg-orange-400" },
          { label: "Mild (≥25%)", bar: "bg-yellow-400" },
          { label: "Low (<25%)",  bar: "bg-cyan-500"   },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2 text-[11px] text-gray-500">
            <div className={`w-3 h-3 rounded-sm ${l.bar}`} />
            {l.label}
          </div>
        ))}
      </div>

    </div>
  );
};

export default HeatmapPage;