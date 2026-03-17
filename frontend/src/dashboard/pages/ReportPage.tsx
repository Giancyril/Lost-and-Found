import { useState } from "react";
import {
  FaPrint, FaDownload, FaCalendarAlt, FaBoxOpen, FaExclamationTriangle,
  FaClipboardList, FaUsers, FaMapMarkerAlt, FaChartBar,
  FaClock, FaTrophy, FaArrowUp, FaArrowDown, FaMinus,
} from "react-icons/fa";
import { useAdminStatsQuery, useGetLocationStatsQuery } from "../../redux/api/api";

// ── Types ─────────────────────────────────────────────────────────────────────
type Period = "week" | "month" | "custom";

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  trend?: "up" | "down" | "neutral";
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString();


const formatDateRange = (period: Period, from: string, to: string) => {
  const now = new Date();
  if (period === "week") {
    const start = new Date(now); start.setDate(now.getDate() - 7);
    return `${start.toLocaleDateString("en-PH", { month: "short", day: "numeric" })} – ${now.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}`;
  }
  if (period === "month") {
    return now.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
  }
  return `${from} – ${to}`;
};

const TrendIcon = ({ trend }: { trend?: "up" | "down" | "neutral" }) => {
  if (trend === "up")      return <FaArrowUp size={9} className="text-emerald-400" />;
  if (trend === "down")    return <FaArrowDown size={9} className="text-red-400" />;
  if (trend === "neutral") return <FaMinus size={9} className="text-gray-500" />;
  return null;
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon, color, trend }: StatCardProps) => (
  <div className={`report-stat-card rounded-xl p-4 border ${color}`}>
    <div className="flex items-start justify-between mb-2">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5">{icon}</div>
      <TrendIcon trend={trend} />
    </div>
    <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
    <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
    {sub && <p className="text-[10px] text-gray-600 mt-1">{sub}</p>}
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const ReportPage = () => {
  const [period, setPeriod]     = useState<Period>("month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate]     = useState("");

  const { data: statsData,    isLoading: statsLoading }    = useAdminStatsQuery({});
  const { data: locationData, isLoading: locationLoading } = useGetLocationStatsQuery({});

  const stats     = statsData?.data;
  const locations = locationData?.data ?? [];
  const isLoading = statsLoading || locationLoading;

  // ── Derived values based on period ────────────────────────────────────────
  const foundCount  = period === "week" ? (stats?.foundThisWeek  ?? 0) : (stats?.foundThisMonth  ?? 0);
  const lostCount   = period === "week" ? (stats?.lostThisWeek   ?? 0) : (stats?.lostThisMonth   ?? 0);
  const claimCount  = period === "week" ? (stats?.claimsThisWeek ?? 0) : (stats?.totalClaims     ?? 0);

  // ── Print handler ─────────────────────────────────────────────────────────
  const handlePrint = () => window.print();

  // ── PDF download via print-to-PDF ─────────────────────────────────────────
  const handleDownload = () => {
    const style = document.createElement("style");
    style.innerHTML = `@media print { body * { visibility: hidden; } #report-printable, #report-printable * { visibility: visible; } #report-printable { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none !important; } }`;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  // ── Top locations (up to 8) ────────────────────────────────────────────────
  const topLocations = [...locations].sort((a: any, b: any) => b.total - a.total).slice(0, 8);
  const maxLocCount  = topLocations[0]?.total ?? 1;

  // ── Monthly trend for period selector label ────────────────────────────────
  const dateRange = formatDateRange(period, fromDate, toDate);

  if (isLoading) return (
    <div className="space-y-4 animate-pulse max-w-5xl mx-auto">
      <div className="h-20 bg-gray-800/60 rounded-2xl" />
      <div className="grid grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-800/60 rounded-xl" />)}
      </div>
      <div className="h-64 bg-gray-800/60 rounded-2xl" />
    </div>
  );

  return (
    <>
      {/* ── Print styles injected into head ────────────────────────────────── */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          #report-printable { padding: 0 !important; }
          .print-page { background: white !important; color: black !important; }
          .print-card { background: #f9fafb !important; border-color: #e5e7eb !important; }
          .print-text-dark { color: #111827 !important; }
          .print-text-gray { color: #6b7280 !important; }
          .print-border { border-color: #e5e7eb !important; }
          @page { margin: 1.5cm; size: A4; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="space-y-5 max-w-5xl mx-auto">

        {/* ── Controls bar (no-print) ──────────────────────────────────────── */}
        <div className="no-print bg-gray-900 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <FaChartBar className="text-cyan-400" size={15} /> Summary Report
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">Generate and export a printable summary</p>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1 bg-gray-800 border border-white/5 rounded-xl p-1">
              {(["week", "month", "custom"] as Period[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                    period === p ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-gray-500 hover:text-white"
                  }`}>
                  {p === "week" ? "This Week" : p === "month" ? "This Month" : "Custom"}
                </button>
              ))}
            </div>

            {period === "custom" && (
              <div className="flex items-center gap-2">
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                  className="bg-gray-800 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500/40" />
                <span className="text-gray-600 text-xs">to</span>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                  className="bg-gray-800 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500/40" />
              </div>
            )}

            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-white/10 text-gray-300 hover:text-white text-xs font-medium rounded-xl transition-all">
              <FaPrint size={11} /> Print
            </button>
            <button onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-medium rounded-xl transition-all">
              <FaDownload size={11} /> Download PDF
            </button>
          </div>
        </div>

        {/* ── PRINTABLE REPORT ─────────────────────────────────────────────── */}
        <div id="report-printable" className="print-page space-y-5">

          {/* Report header */}
          <div className="bg-gray-900 print-card border border-white/5 print-border rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <img src="https://nbsc.edu.ph/wp-content/uploads/2024/03/cropped-NBSC_NewLogo_icon.png"
                    alt="NBSC" className="w-10 h-10 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <div>
                    <p className="text-white print-text-dark font-bold text-lg leading-tight">NBSC SAS Lost & Found</p>
                    <p className="text-gray-400 print-text-gray text-xs">Summary Report</p>
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-white print-text-dark mt-3">
                  {period === "week" ? "Weekly" : period === "month" ? "Monthly" : "Custom Period"} Report
                </h1>
                <p className="text-cyan-400 text-sm font-medium mt-0.5">{dateRange}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 print-text-gray text-[10px] uppercase tracking-widest">Generated</p>
                <p className="text-white print-text-dark text-sm font-semibold">
                  {new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                </p>
                <p className="text-gray-500 print-text-gray text-xs mt-0.5">
                  {new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>

          {/* ── Primary stats grid ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Found Items"     value={fmt(foundCount)}               icon={<FaBoxOpen size={14} className="text-cyan-400" />}            color="bg-gray-900 print-card border-white/5 print-border" sub={`${fmt(stats?.foundItems)} total`}          trend="up"      />
            <StatCard label="Lost Items"      value={fmt(lostCount)}                icon={<FaExclamationTriangle size={14} className="text-red-400" />}  color="bg-gray-900 print-card border-white/5 print-border" sub={`${fmt(stats?.lostItems)} total`}           trend="neutral" />
            <StatCard label="Claims"          value={fmt(claimCount)}               icon={<FaClipboardList size={14} className="text-yellow-400" />}     color="bg-gray-900 print-card border-white/5 print-border" sub={`${fmt(stats?.pendingClaims)} pending`}      trend="neutral" />
            <StatCard label="Registered Users" value={fmt(stats?.totalUsers)}       icon={<FaUsers size={14} className="text-violet-400" />}             color="bg-gray-900 print-card border-white/5 print-border" sub="all time"                                             />
          </div>

          {/* ── Claims breakdown + Rates ──────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Claims breakdown */}
            <div className="bg-gray-900 print-card border border-white/5 print-border rounded-2xl p-5">
              <h3 className="text-white print-text-dark text-sm font-bold mb-4 flex items-center gap-2">
                <FaClipboardList className="text-yellow-400" size={13} /> Claims Breakdown
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Total Claims",    value: stats?.totalClaims,    color: "bg-white/20",           text: "text-white"        },
                  { label: "Pending",         value: stats?.pendingClaims,  color: "bg-yellow-400",         text: "text-yellow-400"   },
                  { label: "Approved",        value: stats?.approvedClaims, color: "bg-emerald-400",        text: "text-emerald-400"  },
                  { label: "Rejected",        value: stats?.rejectedClaims, color: "bg-red-400",            text: "text-red-400"      },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/5 print-border last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${row.color}`} />
                      <span className="text-gray-400 print-text-gray text-xs">{row.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${row.text} print-text-dark`}>{fmt(row.value)}</span>
                  </div>
                ))}
                {stats?.avgClaimResolutionDays != null && (
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <FaClock size={10} className="text-gray-500" />
                      <span className="text-gray-500 text-xs">Avg. Resolution Time</span>
                    </div>
                    <span className="text-white print-text-dark text-sm font-bold">{stats.avgClaimResolutionDays}d</span>
                  </div>
                )}
              </div>
            </div>

            {/* Performance rates */}
            <div className="bg-gray-900 print-card border border-white/5 print-border rounded-2xl p-5">
              <h3 className="text-white print-text-dark text-sm font-bold mb-4 flex items-center gap-2">
                <FaChartBar className="text-cyan-400" size={13} /> Performance Rates
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Disposal Rate",   value: stats?.disposalRate   ?? 0, color: "bg-emerald-400", desc: `${fmt(stats?.claimedItems)} of ${fmt(stats?.foundItems)} items claimed`      },
                  { label: "Resolution Rate", value: stats?.resolutionRate  ?? 0, color: "bg-blue-400",   desc: `${fmt(stats?.resolvedLostItems)} of ${fmt(stats?.lostItems)} resolved`       },
                  { label: "Match Rate",      value: stats?.lostFoundMatchRate?.matchRate ?? 0, color: "bg-cyan-400", desc: `${fmt(stats?.lostFoundMatchRate?.totalResolved)} matched`         },
                ].map(row => (
                  <div key={row.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400 print-text-gray text-xs">{row.label}</span>
                      <span className="text-white print-text-dark text-xs font-bold">{row.value}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${row.color}`} style={{ width: `${Math.min(row.value, 100)}%` }} />
                    </div>
                    <p className="text-gray-600 print-text-gray text-[10px] mt-0.5">{row.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Top Locations ─────────────────────────────────────────────── */}
          <div className="bg-gray-900 print-card border border-white/5 print-border rounded-2xl p-5">
            <h3 className="text-white print-text-dark text-sm font-bold mb-4 flex items-center gap-2">
              <FaMapMarkerAlt className="text-orange-400" size={13} /> Top Locations
            </h3>
            {topLocations.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-6">No location data available</p>
            ) : (
              <div className="space-y-2.5">
                {topLocations.map((loc: any, i: number) => (
                  <div key={loc.location} className="flex items-center gap-3">
                    <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i === 0 ? "bg-yellow-400/20 text-yellow-400" :
                      i === 1 ? "bg-gray-400/20 text-gray-300" :
                      i === 2 ? "bg-orange-400/20 text-orange-400" : "bg-white/5 text-gray-500"
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white print-text-dark text-xs font-medium truncate">{loc.location}</p>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <span className="text-cyan-400 text-[10px]">F: {loc.found}</span>
                          <span className="text-red-400 text-[10px]">L: {loc.lost}</span>
                          <span className="text-white print-text-dark text-xs font-bold">{loc.total}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1">
                        <div className="h-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                          style={{ width: `${(loc.total / maxLocCount) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5 print-border">
              <span className="flex items-center gap-1 text-[10px] text-cyan-400"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Found</span>
              <span className="flex items-center gap-1 text-[10px] text-red-400"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Lost</span>
              <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" /> Total</span>
            </div>
          </div>

          {/* ── Category Breakdown ────────────────────────────────────────── */}
          {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 && (
            <div className="bg-gray-900 print-card border border-white/5 print-border rounded-2xl p-5">
              <h3 className="text-white print-text-dark text-sm font-bold mb-4 flex items-center gap-2">
                <FaBoxOpen className="text-violet-400" size={13} /> Category Breakdown
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.categoryBreakdown.map((cat: any) => (
                  <div key={cat.name} className="bg-gray-800/60 print-card border border-white/5 print-border rounded-xl p-3">
                    <p className="text-white print-text-dark text-xs font-semibold truncate">{cat.name}</p>
                    <p className="text-2xl font-bold text-white print-text-dark mt-1">{cat.total}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-cyan-400 text-[10px]">F:{cat.found}</span>
                      <span className="text-red-400 text-[10px]">L:{cat.lost}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Unclaimed Items Age + Top Reporters ──────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Unclaimed age */}
            <div className="bg-gray-900 print-card border border-white/5 print-border rounded-2xl p-5">
              <h3 className="text-white print-text-dark text-sm font-bold mb-4 flex items-center gap-2">
                <FaClock className="text-orange-400" size={13} /> Unclaimed Items Age
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: "Total Unclaimed",  value: stats?.unclaimedItemsAge?.total,      color: "text-white"        },
                  { label: "Over 7 days",      value: stats?.unclaimedItemsAge?.over7days,  color: "text-yellow-400"   },
                  { label: "Over 30 days",     value: stats?.unclaimedItemsAge?.over30days, color: "text-orange-400"   },
                  { label: "Over 90 days",     value: stats?.unclaimedItemsAge?.over90days, color: "text-red-400"      },
                  { label: "Avg Age (days)",   value: stats?.unclaimedItemsAge?.avgAgeDays, color: "text-gray-300"     },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-white/5 print-border last:border-0">
                    <span className="text-gray-400 print-text-gray text-xs">{row.label}</span>
                    <span className={`text-sm font-bold ${row.color} print-text-dark`}>{fmt(row.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top reporters */}
            <div className="bg-gray-900 print-card border border-white/5 print-border rounded-2xl p-5">
              <h3 className="text-white print-text-dark text-sm font-bold mb-4 flex items-center gap-2">
                <FaTrophy className="text-yellow-400" size={13} /> Top Reporters
              </h3>
              {!stats?.topReporters || stats.topReporters.length === 0 ? (
                <p className="text-gray-600 text-xs text-center py-6">No reporter data</p>
              ) : (
                <div className="space-y-2.5">
                  {stats.topReporters.map((r: any, i: number) => (
                    <div key={r.name} className="flex items-center gap-3">
                      <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        i === 0 ? "bg-yellow-400/20 text-yellow-400" :
                        i === 1 ? "bg-gray-400/20 text-gray-300" :
                        i === 2 ? "bg-orange-400/20 text-orange-400" : "bg-white/5 text-gray-600"
                      }`}>{i + 1}</span>
                      <p className="flex-1 text-white print-text-dark text-xs truncate">{r.name}</p>
                      <span className="shrink-0 text-xs font-bold text-cyan-400">{r.count} items</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Monthly Trend Table ──────────────────────────────────────── */}
          {stats?.monthlyStats && (
            <div className="bg-gray-900 print-card border border-white/5 print-border rounded-2xl p-5">
              <h3 className="text-white print-text-dark text-sm font-bold mb-4 flex items-center gap-2">
                <FaCalendarAlt className="text-cyan-400" size={13} /> 6-Month Trend
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5 print-border">
                      {["Month", "Found", "Lost", "Claims", "Resolved", "Resolution %"].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-gray-500 print-text-gray font-medium uppercase tracking-wider text-[10px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.monthlyStats.map((row: any) => (
                      <tr key={row.month} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 text-white print-text-dark font-semibold">{row.month}</td>
                        <td className="py-2.5 px-3 text-cyan-400">{row.found}</td>
                        <td className="py-2.5 px-3 text-red-400">{row.lost}</td>
                        <td className="py-2.5 px-3 text-yellow-400">{row.claims}</td>
                        <td className="py-2.5 px-3 text-emerald-400">{row.resolved}</td>
                        <td className="py-2.5 px-3">
                          <span className={`font-bold ${row.resolutionRate >= 50 ? "text-emerald-400" : row.resolutionRate > 0 ? "text-yellow-400" : "text-gray-600"}`}>
                            {row.resolutionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div className="bg-gray-900 print-card border border-white/5 print-border rounded-2xl px-5 py-4 flex items-center justify-between">
            <p className="text-gray-600 text-[10px]">NBSC SAS Lost & Found System · Auto-generated report</p>
            <p className="text-gray-600 text-[10px]">
              {new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })} · {new Date().toLocaleTimeString("en-PH")}
            </p>
          </div>

        </div>
        {/* end printable */}
      </div>
    </>
  );
};

export default ReportPage;