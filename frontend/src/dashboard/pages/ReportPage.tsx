import { useState } from "react";
import {
  FaPrint, FaDownload, FaCalendarAlt, FaBoxOpen, FaExclamationTriangle,
  FaClipboardList, FaUsers, FaMapMarkerAlt, FaChartBar,
  FaClock, FaTrophy,
} from "react-icons/fa";
import { useAdminStatsQuery, useGetLocationStatsQuery } from "../../redux/api/api";

type Period = "week" | "month" | "custom";

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString();

const formatDateRange = (period: Period, from: string, to: string) => {
  const now = new Date();
  if (period === "week") {
    const start = new Date(now); start.setDate(now.getDate() - 7);
    return `${start.toLocaleDateString("en-PH", { month: "long", day: "numeric" })} – ${now.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}`;
  }
  if (period === "month") return now.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
  return from && to ? `${from} – ${to}` : "Custom Period";
};

const ReportPage = () => {
  const [period, setPeriod]     = useState<Period>("month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate]     = useState("");

  const { data: statsData,    isLoading: statsLoading }    = useAdminStatsQuery({});
  const { data: locationData, isLoading: locationLoading } = useGetLocationStatsQuery({});

  const stats     = statsData?.data;
  const locations = locationData?.data ?? [];
  const isLoading = statsLoading || locationLoading;

  const foundCount = period === "week" ? (stats?.foundThisWeek  ?? 0) : (stats?.foundThisMonth  ?? 0);
  const lostCount  = period === "week" ? (stats?.lostThisWeek   ?? 0) : (stats?.lostThisMonth   ?? 0);
  const claimCount = period === "week" ? (stats?.claimsThisWeek ?? 0) : (stats?.totalClaims     ?? 0);

  const handlePrint    = () => window.print();
  const handleDownload = () => {
    const style = document.createElement("style");
    style.innerHTML = `@media print { body * { visibility: hidden; } #rpt, #rpt * { visibility: visible; } #rpt { position: absolute; left: 0; top: 0; width: 100%; } }`;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  const topLocations = [...locations].sort((a: any, b: any) => b.total - a.total).slice(0, 8);
  const maxLoc       = topLocations[0]?.total ?? 1;
  const dateRange    = formatDateRange(period, fromDate, toDate);
  const now          = new Date();

  if (isLoading) return (
    <div className="space-y-4 animate-pulse max-w-7xl mx-auto">
      <div className="h-20 bg-gray-800/60 rounded-2xl" />
      <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-800/60 rounded-xl" />)}</div>
      <div className="h-64 bg-gray-800/60 rounded-2xl" />
    </div>
  );

  return (
    <>
      <style>{`
        @media print {
          /* Hide all dashboard chrome */
          header, nav, aside, .no-print,
          [class*="topbar"], [class*="sidebar"] {
            display: none !important;
            visibility: hidden !important;
          }
          body, html { background: white !important; margin: 0; padding: 0; }
          body * { visibility: hidden; }
          #rpt, #rpt * { visibility: visible !important; }
          #rpt {
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          /* Clean professional print overrides */
          #rpt .r-card {
            background: white !important;
            border: 1px solid #d1d5db !important;
            border-radius: 6px !important;
            break-inside: avoid;
          }
          #rpt .r-text  { color: #111827 !important; }
          #rpt .r-muted { color: #6b7280 !important; }
          #rpt .r-bar   { background: #e5e7eb !important; }
          #rpt .r-divider { border-color: #e5e7eb !important; }
          #rpt .r-accent  { color: #1d4ed8 !important; }
          #rpt th { background: #f9fafb !important; color: #6b7280 !important; }
          #rpt td, #rpt th { border-bottom: 1px solid #e5e7eb !important; }
          @page { margin: 1.5cm; size: A4 portrait; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="space-y-4 max-w-7xl mx-auto">

       {/* ── Controls bar — screen only ── */}
        <div className="no-print bg-gray-900/50 border border-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <div>
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <FaChartBar className="text-cyan-400" size={15} /> Summary Report
            </h2>
            <p className="text-gray-500 text-[11px] mt-0.5">Generate and export a printable summary</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
          {/* --- SEGMENTED CONTROL --- */}
          <div className="flex bg-black/20 border border-white/5 rounded-2xl p-1">
            {(["week", "month", "custom"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 outline-none select-none ${
                  period === p
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm"
                    : "text-gray-500 hover:text-gray-300 border border-transparent"
                }`}
              >
                {p === "week" ? "This Week" : p === "month" ? "This Month" : "Custom"}
              </button>
            ))}
          </div>

          {/* --- SMOOTH TRANSITION DATE INPUTS --- */}
          <div 
            className={`flex items-center gap-2 overflow-hidden transition-all duration-500 ease-in-out ${
              period === "custom" 
                ? "max-w-[500px] opacity-100 translate-x-0" 
                : "max-w-0 opacity-0 -translate-x-4 pointer-events-none"
            }`}
          >
            <input 
              type="date" 
              value={fromDate} 
              onChange={e => setFromDate(e.target.value)}
              className="bg-gray-800/40 border border-white/10 rounded-xl px-3 py-1.5 text-white text-[11px] focus:outline-none focus:border-cyan-500/40 transition-colors cursor-pointer [color-scheme:dark]" 
            />
            <span className="text-gray-600 text-[10px] font-medium uppercase tracking-wider">to</span>
            <input 
              type="date" 
              value={toDate} 
              onChange={e => setToDate(e.target.value)}
              className="bg-gray-800/40 border border-white/10 rounded-xl px-3 py-1.5 text-white text-[11px] focus:outline-none focus:border-cyan-500/40 transition-colors cursor-pointer [color-scheme:dark]" 
            />
          </div>

          {/* Print & Download Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 text-gray-300 hover:text-white text-xs font-medium rounded-xl transition-all active:scale-95">
              <FaPrint size={12} /> <span className="hidden sm:inline">Print</span>
            </button>
            <button onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-medium rounded-xl transition-all active:scale-95">
              <FaDownload size={12} /> <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>
        </div>

        {/* ── PRINTABLE REPORT ── */}
        <div id="rpt">
          <div className="space-y-4">

            {/* Cover header */}
            <div className="r-card bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5">
              {/* Top row: title | generated date */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="r-text text-white font-bold text-base sm:text-lg leading-tight">NBSC SAS Lost & Found</p>
                  <p className="r-muted text-gray-400 text-[10px] mt-0.5 uppercase tracking-widest">Student Affairs Services · Northern Bukidnon State College</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="r-muted text-gray-500 text-[10px] uppercase tracking-widest">Generated</p>
                  <p className="r-text text-white text-xs sm:text-sm font-semibold mt-0.5">
                    {now.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                  <p className="r-muted text-gray-500 text-xs mt-0.5">
                    {now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              {/* Bottom row: report title | prepared by */}
              <div className="mt-3 pt-3 border-t border-white/5 r-divider flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                  <p className="text-cyan-400 text-[10px] font-semibold uppercase tracking-widest mb-1">
                    {period === "week" ? "Weekly" : period === "month" ? "Monthly" : "Custom Period"} Summary Report
                  </p>
                  <p className="r-text text-white text-xl sm:text-2xl font-bold leading-tight">{dateRange}</p>
                </div>
                <div className="sm:text-right">
                  <p className="r-muted text-gray-600 text-[10px]">Prepared by: System Admin</p>
                  <p className="r-muted text-gray-600 text-[10px] mt-0.5">NBSC Lost & Found System</p>
                </div>
              </div>
            </div>

            {/* Section divider */}
            <div className="flex items-center gap-3 px-1">
              <div className="h-px flex-1 bg-white/5" />
              <p className="text-gray-600 text-[10px] uppercase tracking-widest font-medium no-print">Overview Statistics</p>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Found Items",      value: foundCount,             sub: `${fmt(stats?.foundItems)} all-time`,    icon: <FaBoxOpen size={14} className="text-cyan-400" />,            accent: "border-cyan-500/20"   },
                { label: "Lost Items",       value: lostCount,              sub: `${fmt(stats?.lostItems)} all-time`,     icon: <FaExclamationTriangle size={14} className="text-red-400" />, accent: "border-red-500/20"    },
                { label: "Claims",           value: claimCount,             sub: `${fmt(stats?.pendingClaims)} pending`,  icon: <FaClipboardList size={14} className="text-yellow-400" />,    accent: "border-yellow-500/20" },
                { label: "Registered Users", value: stats?.totalUsers ?? 0, sub: "all time",                             icon: <FaUsers size={14} className="text-violet-400" />,            accent: "border-violet-500/20" },
              ].map(card => (
                <div key={card.label} className={`r-card bg-gray-900 border ${card.accent} rounded-xl p-4`}>
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-3">{card.icon}</div>
                  <p className="r-text text-white text-3xl font-bold tracking-tight">{fmt(card.value)}</p>
                  <p className="r-text text-gray-300 text-xs font-semibold mt-1">{card.label}</p>
                  <p className="r-muted text-gray-500 text-[10px] mt-0.5">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Claims + Performance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="r-card bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5">
                <h3 className="r-text text-white text-sm font-bold flex items-center gap-2">
                  <FaClipboardList className="text-yellow-400" size={12} /> Claims Summary
                </h3>
                <p className="r-muted text-gray-500 text-[10px] mt-0.5 mb-4 uppercase tracking-wider">Status breakdown</p>
                <table className="w-full">
                  <tbody>
                    {[
                      { label: "Total Claims",   value: stats?.totalClaims,    dot: "bg-white/30"    },
                      { label: "Pending Review", value: stats?.pendingClaims,  dot: "bg-yellow-400"  },
                      { label: "Approved",       value: stats?.approvedClaims, dot: "bg-emerald-400" },
                      { label: "Rejected",       value: stats?.rejectedClaims, dot: "bg-red-400"     },
                    ].map((row, i) => (
                      <tr key={row.label} className={i < 3 ? "border-b border-white/5 r-divider" : ""}>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${row.dot}`} />
                            <span className="r-muted text-gray-400 text-xs">{row.label}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right">
                          <span className="r-text text-white text-sm font-bold">{fmt(row.value)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {stats?.avgClaimResolutionDays != null && (
                  <div className="mt-3 pt-3 border-t border-white/5 r-divider flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaClock size={10} className="text-gray-500" />
                      <span className="r-muted text-gray-500 text-xs">Avg. Resolution Time</span>
                    </div>
                    <span className="r-text text-white text-sm font-bold">{stats.avgClaimResolutionDays} days</span>
                  </div>
                )}
              </div>

              <div className="r-card bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5">
                <h3 className="r-text text-white text-sm font-bold flex items-center gap-2">
                  <FaChartBar className="text-cyan-400" size={12} /> Performance Metrics
                </h3>
                <p className="r-muted text-gray-500 text-[10px] mt-0.5 mb-4 uppercase tracking-wider">System efficiency rates</p>
                <div className="space-y-4">
                  {[
                    { label: "Disposal Rate",   value: stats?.disposalRate ?? 0,   bar: "bg-emerald-400", desc: `${fmt(stats?.claimedItems)} of ${fmt(stats?.foundItems)} found items claimed`       },
                    { label: "Resolution Rate", value: stats?.resolutionRate ?? 0,  bar: "bg-blue-400",   desc: `${fmt(stats?.resolvedLostItems)} of ${fmt(stats?.lostItems)} lost items resolved`    },
                    { label: "Match Rate",      value: stats?.lostFoundMatchRate?.matchRate ?? 0, bar: "bg-cyan-400", desc: `${fmt(stats?.lostFoundMatchRate?.totalResolved)} items matched`          },
                  ].map(row => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="r-text text-gray-300 text-xs font-medium">{row.label}</span>
                        <span className="r-text text-white text-sm font-bold">{row.value}%</span>
                      </div>
                      <div className="r-bar w-full bg-gray-800 rounded-full h-2">
                        <div className={`h-2 rounded-full ${row.bar}`} style={{ width: `${Math.min(row.value, 100)}%` }} />
                      </div>
                      <p className="r-muted text-gray-600 text-[10px] mt-1">{row.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Locations */}
            <div className="r-card bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5">
              <h3 className="r-text text-white text-sm font-bold flex items-center gap-2">
                <FaMapMarkerAlt className="text-orange-400" size={12} /> Top Reported Locations
              </h3>
              <p className="r-muted text-gray-500 text-[10px] mt-0.5 mb-4 uppercase tracking-wider">Areas with highest item activity</p>
              {topLocations.length === 0 ? (
                <p className="r-muted text-gray-600 text-sm text-center py-6">No location data available</p>
              ) : (
                <div className="space-y-3">
                  {topLocations.map((loc: any, i: number) => (
                    <div key={loc.location} className="flex items-center gap-3">
                      <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        i === 0 ? "bg-yellow-400/20 text-yellow-400" :
                        i === 1 ? "bg-gray-400/20 text-gray-300"   :
                        i === 2 ? "bg-orange-400/20 text-orange-400" : "bg-white/5 text-gray-500"
                      }`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="r-text text-white text-xs font-semibold truncate">{loc.location}</p>
                          <div className="flex items-center gap-3 shrink-0 ml-3 text-[10px]">
                            <span className="text-cyan-400">F: {loc.found}</span>
                            <span className="text-red-400">L: {loc.lost}</span>
                            <span className="r-text text-white font-bold">Total: {loc.total}</span>
                          </div>
                        </div>
                        <div className="r-bar w-full bg-gray-800 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                            style={{ width: `${(loc.total / maxLoc) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category + Unclaimed + Reporters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 && (
                <div className="r-card bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5">
                  <h3 className="r-text text-white text-sm font-bold flex items-center gap-2">
                    <FaBoxOpen className="text-violet-400" size={12} /> By Category
                  </h3>
                  <p className="r-muted text-gray-500 text-[10px] mt-0.5 mb-4 uppercase tracking-wider">Item type breakdown</p>
                  <div className="space-y-1.5">
                    {stats.categoryBreakdown.map((cat: any) => (
                      <div key={cat.name} className="flex items-center justify-between py-1.5 border-b border-white/5 r-divider last:border-0">
                        <p className="r-text text-gray-300 text-xs truncate pr-2">{cat.name}</p>
                        <div className="flex items-center gap-2 shrink-0 text-[10px]">
                          <span className="text-cyan-400">{cat.found}F</span>
                          <span className="text-red-400">{cat.lost}L</span>
                          <span className="r-text text-white font-bold w-4 text-right">{cat.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="r-card bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5">
                <h3 className="r-text text-white text-sm font-bold flex items-center gap-2">
                  <FaClock className="text-orange-400" size={12} /> Unclaimed Items
                </h3>
                <p className="r-muted text-gray-500 text-[10px] mt-0.5 mb-4 uppercase tracking-wider">Age analysis</p>
                <div className="space-y-1.5">
                  {[
                    { label: "Total Unclaimed", value: fmt(stats?.unclaimedItemsAge?.total),                                                color: "text-white"      },
                    { label: "Over 7 days",     value: fmt(stats?.unclaimedItemsAge?.over7days),                                            color: "text-yellow-400" },
                    { label: "Over 30 days",    value: fmt(stats?.unclaimedItemsAge?.over30days),                                           color: "text-orange-400" },
                    { label: "Over 90 days",    value: fmt(stats?.unclaimedItemsAge?.over90days),                                           color: "text-red-400"    },
                    { label: "Avg Age",         value: stats?.unclaimedItemsAge?.avgAgeDays ? `${stats.unclaimedItemsAge.avgAgeDays}d` : "—", color: "text-gray-300" },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-white/5 r-divider last:border-0">
                      <span className="r-muted text-gray-400 text-xs">{row.label}</span>
                      <span className={`text-xs font-bold ${row.color} r-text`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="r-card bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5">
                <h3 className="r-text text-white text-sm font-bold flex items-center gap-2">
                  <FaTrophy className="text-yellow-400" size={12} /> Top Reporters
                </h3>
                <p className="r-muted text-gray-500 text-[10px] mt-0.5 mb-4 uppercase tracking-wider">Most active contributors</p>
                {!stats?.topReporters || stats.topReporters.length === 0 ? (
                  <p className="r-muted text-gray-600 text-xs text-center py-4">No data</p>
                ) : (
                  <div className="space-y-1.5">
                    {stats.topReporters.map((r: any, i: number) => (
                      <div key={r.name} className="flex items-center gap-2.5 py-1.5 border-b border-white/5 r-divider last:border-0">
                        <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          i === 0 ? "bg-yellow-400/20 text-yellow-400" :
                          i === 1 ? "bg-gray-400/20  text-gray-300"   :
                          i === 2 ? "bg-orange-400/20 text-orange-400" : "bg-white/5 text-gray-600"
                        }`}>{i + 1}</span>
                        <p className="r-text text-gray-300 text-xs flex-1 truncate">{r.name}</p>
                        <span className="text-cyan-400 text-xs font-bold shrink-0">{r.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 6-Month Trend */}
            {stats?.monthlyStats && (
              <div className="r-card bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5">
                <h3 className="r-text text-white text-sm font-bold flex items-center gap-2">
                  <FaCalendarAlt className="text-cyan-400" size={12} /> 6-Month Activity Trend
                </h3>
                <p className="r-muted text-gray-500 text-[10px] mt-0.5 mb-4 uppercase tracking-wider">Monthly breakdown of all activity</p>
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10 r-divider">
                        {["Month", "Found", "Lost", "Claims", "Resolved", "Resolution Rate"].map(h => (
                          <th key={h} className="text-left py-2.5 px-3 r-muted text-gray-500 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.monthlyStats.map((row: any, i: number) => (
                        <tr key={row.month} className={i < stats.monthlyStats.length - 1 ? "border-b border-white/5 r-divider" : ""}>
                          <td className="py-2.5 px-3 r-text text-white font-bold">{row.month}</td>
                          <td className="py-2.5 px-3 text-cyan-400 font-semibold">{row.found}</td>
                          <td className="py-2.5 px-3 text-red-400 font-semibold">{row.lost}</td>
                          <td className="py-2.5 px-3 text-yellow-400 font-semibold">{row.claims}</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-semibold">{row.resolved}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="r-bar flex-1 bg-gray-800 rounded-full h-1.5 min-w-[40px]">
                                <div className={`h-1.5 rounded-full ${row.resolutionRate >= 50 ? "bg-emerald-400" : row.resolutionRate > 0 ? "bg-yellow-400" : "bg-gray-600"}`}
                                  style={{ width: `${Math.min(row.resolutionRate, 100)}%` }} />
                              </div>
                              <span className={`font-bold text-[10px] w-8 text-right ${row.resolutionRate >= 50 ? "text-emerald-400" : row.resolutionRate > 0 ? "text-yellow-400" : "text-gray-600"}`}>
                                {row.resolutionRate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="r-card bg-gray-900 border border-white/5 rounded-2xl px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="https://nbsc.edu.ph/wp-content/uploads/2024/03/cropped-NBSC_NewLogo_icon.png"
                  alt="NBSC" className="w-5 h-5 object-contain opacity-40"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <p className="r-muted text-gray-600 text-[10px]">NBSC SAS Lost & Found System · Confidential Document</p>
              </div>
              <p className="r-muted text-gray-600 text-[10px]">
                Generated {now.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })} · {now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

          </div>
        </div>

      </div>
    </>
  );
};

export default ReportPage;