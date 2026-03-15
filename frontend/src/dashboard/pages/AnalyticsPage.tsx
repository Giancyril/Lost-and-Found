import { useState } from "react";
import {
  FaTrophy, FaMedal, FaClock,
  FaBoxOpen, FaCheckCircle,
} from "react-icons/fa";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useAdminStatsQuery } from "../../redux/api/api";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-xs">
      <p className="text-gray-400 font-medium mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-gray-300 capitalize">{p.name}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const ChartToggle = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button onClick={onClick}
    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
      active ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-gray-500 hover:text-white"
    }`}>
    {label}
  </button>
);

const medalColor = (i: number) => {
  if (i === 0) return { bg: "bg-yellow-400/10 border-yellow-400/20", text: "text-yellow-400", icon: <FaTrophy size={12} className="text-yellow-400" /> };
  if (i === 1) return { bg: "bg-gray-400/10 border-gray-400/20",     text: "text-gray-300",   icon: <FaMedal  size={12} className="text-gray-300"   /> };
  if (i === 2) return { bg: "bg-orange-400/10 border-orange-400/20", text: "text-orange-400", icon: <FaMedal  size={12} className="text-orange-400" /> };
  return             { bg: "bg-white/5 border-white/5",              text: "text-gray-500",   icon: <span className="text-gray-600 text-xs font-bold w-3 text-center">{i + 1}</span> };
};

const AnalyticsPage = () => {
  const [chartType, setChartType]   = useState<"area" | "bar">("area");
  const [peakView, setPeakView]     = useState<"days" | "hours">("days");
  const { data: statsData, isLoading } = useAdminStatsQuery({});
  const stats = statsData?.data;

  if (isLoading) return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      <div className="h-10 w-48 bg-gray-800/60 rounded-xl" />
      <div className="h-80 bg-gray-800/60 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-80 bg-gray-800/60 rounded-2xl" />
        <div className="h-80 bg-gray-800/60 rounded-2xl" />
      </div>
    </div>
  );

  const monthlyStats  = stats?.monthlyStats      || [];
  const topReporters  = stats?.topReporters       || [];
  const catBreakdown  = stats?.categoryBreakdown  || [];
  const peakDays      = stats?.peakReportingDays  || [];
  const peakHours     = stats?.peakReportingHours || [];
  const unclaimedAge  = stats?.unclaimedItemsAge  || {};
  const matchRate     = stats?.lostFoundMatchRate  || {};

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* Summary stat pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Found",   value: stats?.foundItems   ?? 0, color: "text-cyan-400",   bg: "bg-cyan-400/10 border-cyan-400/20"      },
          { label: "Total Lost",    value: stats?.lostItems    ?? 0, color: "text-red-400",    bg: "bg-red-400/10 border-red-400/20"        },
          { label: "Total Claims",  value: stats?.totalClaims  ?? 0, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20"  },
          { label: "Claimed Items", value: stats?.claimedItems ?? 0, color: "text-emerald-400",bg: "bg-emerald-400/10 border-emerald-400/20"},
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 flex flex-col gap-1 ${s.bg} bg-gray-900`}>
            <p className={`text-2xl sm:text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly Trends Chart */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <h3 className="text-white text-sm font-semibold">Monthly Trends</h3>
            <p className="text-gray-500 text-xs mt-0.5">Found items, lost reports & claims per month</p>
          </div>
          <div className="flex gap-1 bg-gray-800 border border-white/5 rounded-lg p-1">
            <ChartToggle active={chartType === "area"} label="Area" onClick={() => setChartType("area")} />
            <ChartToggle active={chartType === "bar"}  label="Bar"  onClick={() => setChartType("bar")}  />
          </div>
        </div>
        <div className="flex items-center gap-4 px-5 pt-4">
          {[
            { color: "#22d3ee", label: "Found Items"  },
            { color: "#f87171", label: "Lost Reports" },
            { color: "#facc15", label: "Claims"       },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: l.color }} />
              <span className="text-gray-400 text-xs">{l.label}</span>
            </div>
          ))}
        </div>
        <div className="px-2 pb-4 pt-2 h-72 sm:h-80">
          {monthlyStats.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">No data yet</div>
          ) : chartType === "area" ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyStats} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gFound"  x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} /><stop offset="95%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gLost"   x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f87171" stopOpacity={0.25} /><stop offset="95%" stopColor="#f87171" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gClaims" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#facc15" stopOpacity={0.2}  /><stop offset="95%" stopColor="#facc15" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="found"  name="Found"  stroke="#22d3ee" strokeWidth={2} fill="url(#gFound)"  dot={{ fill: "#22d3ee", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="lost"   name="Lost"   stroke="#f87171" strokeWidth={2} fill="url(#gLost)"   dot={{ fill: "#f87171", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="claims" name="Claims" stroke="#facc15" strokeWidth={2} fill="url(#gClaims)" dot={{ fill: "#facc15", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats} margin={{ top: 10, right: 20, left: -20, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Legend wrapperStyle={{ display: "none" }} />
                <Bar dataKey="found"  name="Found"  fill="#22d3ee" radius={[4,4,0,0]} maxBarSize={28} />
                <Bar dataKey="lost"   name="Lost"   fill="#f87171" radius={[4,4,0,0]} maxBarSize={28} />
                <Bar dataKey="claims" name="Claims" fill="#facc15" radius={[4,4,0,0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        {monthlyStats.length > 0 && (() => {
          const last = monthlyStats[monthlyStats.length - 1];
          const prev = monthlyStats[monthlyStats.length - 2];
          const delta = (field: "found" | "lost" | "claims") => {
            if (!prev) return null;
            const diff = last[field] - prev[field];
            if (diff === 0) return null;
            return <span className={`text-[10px] font-medium ${diff > 0 ? "text-emerald-400" : "text-red-400"}`}>{diff > 0 ? "+" : ""}{diff} vs last month</span>;
          };
          return (
            <div className="grid grid-cols-3 border-t border-white/5">
              {[
                { label: "Found this month",  value: last.found,  color: "text-cyan-400",   field: "found"   as const },
                { label: "Lost this month",   value: last.lost,   color: "text-red-400",    field: "lost"    as const },
                { label: "Claims this month", value: last.claims, color: "text-yellow-400", field: "claims"  as const },
              ].map((s, i) => (
                <div key={i} className={`px-5 py-4 flex flex-col gap-1 ${i > 0 ? "border-l border-white/5" : ""}`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-gray-600 text-[10px]">{s.label}</p>
                  {delta(s.field)}
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* ── NEW: Resolution Rate Trend ── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-white text-sm font-semibold">Resolution Rate Trend</h3>
          <p className="text-gray-500 text-xs mt-0.5">% of lost items resolved per month · resolved items vs lost reports</p>
        </div>
        <div className="px-2 pb-4 pt-4 h-64">
          {monthlyStats.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyStats} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} unit="%" domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }} />
                <Line type="monotone" dataKey="resolutionRate" name="Resolution %" stroke="#a78bfa" strokeWidth={2.5}
                  dot={{ fill: "#a78bfa", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#34d399" strokeWidth={2}
                  dot={{ fill: "#34d399", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        {/* Summary row */}
        <div className="grid grid-cols-3 border-t border-white/5">
          {[
            { label: "Overall Match Rate", value: `${matchRate.matchRate ?? 0}%`, color: "text-violet-400" },
            { label: "Total Resolved",     value: matchRate.totalResolved ?? 0,   color: "text-emerald-400" },
            { label: "Still Unresolved",   value: matchRate.unresolved ?? 0,      color: "text-red-400"     },
          ].map((s, i) => (
            <div key={i} className={`px-5 py-4 flex flex-col gap-1 ${i > 0 ? "border-l border-white/5" : ""}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-600 text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── NEW: Peak Reporting Days/Hours ── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <h3 className="text-white text-sm font-semibold">Peak Reporting Times</h3>
            <p className="text-gray-500 text-xs mt-0.5">When items are most commonly reported lost or found</p>
          </div>
          <div className="flex gap-1 bg-gray-800 border border-white/5 rounded-lg p-1">
            <ChartToggle active={peakView === "days"}  label="By Day"  onClick={() => setPeakView("days")}  />
            <ChartToggle active={peakView === "hours"} label="By Hour" onClick={() => setPeakView("hours")} />
          </div>
        </div>
        <div className="px-2 pb-4 pt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={peakView === "days" ? peakDays : peakHours}
              margin={{ top: 5, right: 20, left: -20, bottom: 0 }}
              barCategoryGap="25%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey={peakView === "days" ? "day" : "label"}
                tick={{ fill: "#6b7280", fontSize: 10 }}
                axisLine={false} tickLine={false}
                interval={0}
                width={60}
              />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="found" name="Found" fill="#22d3ee" radius={[3,3,0,0]} maxBarSize={24} stackId="a" />
              <Bar dataKey="lost"  name="Lost"  fill="#f87171" radius={[3,3,0,0]} maxBarSize={24} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Busiest day/hour callout */}
        {(() => {
          const data    = peakView === "days" ? peakDays : peakHours;
          const busiest = [...data].sort((a: any, b: any) => b.total - a.total)[0];
          const displayKey = peakView === "days" ? "day" : "label";
          const displayName = peakView === "hours"
            ? (busiest[displayKey] as string).split("\n")[0] // just "Early Morning", not the full label
            : busiest[displayKey];
          if (!busiest || busiest.total === 0) return null;
          return (
            <div className="px-5 py-3 border-t border-white/5 flex items-center gap-2">
              <span className="text-yellow-400 text-xs font-semibold">⚡ Busiest {peakView === "days" ? "day" : "time block"}:</span>
              <span className="text-white text-xs font-bold">{displayName}</span>
              <span className="text-gray-500 text-xs">— {busiest.total} reports</span>
            </div>
          );
        })()}
      </div>

      {/* ── NEW: Unclaimed Items Age + Lost vs Found Match Rate ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Unclaimed Items Age */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-white text-sm font-semibold">Unclaimed Items Age</h3>
            <p className="text-gray-500 text-xs mt-0.5">How long found items have been sitting unclaimed</p>
          </div>
          <div className="p-5 space-y-4">
            {/* Age buckets */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "7+ days",  value: unclaimedAge.over7days  ?? 0, color: "text-yellow-400", bg: "bg-yellow-400/5 border-yellow-400/10"  },
                { label: "30+ days", value: unclaimedAge.over30days ?? 0, color: "text-orange-400", bg: "bg-orange-400/5 border-orange-400/10"  },
                { label: "90+ days", value: unclaimedAge.over90days ?? 0, color: "text-red-400",    bg: "bg-red-400/5 border-red-400/10"        },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-gray-600 text-[10px] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            {/* Avg age */}
            <div className="flex items-center justify-between bg-gray-800/60 rounded-xl p-3 border border-white/5">
              <span className="text-gray-400 text-xs">Avg. age of unclaimed items</span>
              <span className="text-white text-sm font-bold">{unclaimedAge.avgAgeDays ?? 0} days</span>
            </div>
            {/* Oldest items list */}
            {unclaimedAge.oldest?.length > 0 && (
              <div className="space-y-2">
                <p className="text-gray-600 text-[10px] uppercase tracking-widest font-medium">Oldest unclaimed</p>
                {unclaimedAge.oldest.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FaBoxOpen size={10} className="text-gray-500 shrink-0" />
                      <p className="text-gray-300 text-xs truncate">{item.name}</p>
                      <p className="text-gray-600 text-[10px] truncate shrink-0">· {item.location}</p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      item.days >= 90 ? "bg-red-400/10 text-red-400" :
                      item.days >= 30 ? "bg-orange-400/10 text-orange-400" :
                      "bg-yellow-400/10 text-yellow-400"
                    }`}>
                      {item.days}d
                    </span>
                  </div>
                ))}
              </div>
            )}
            {(!unclaimedAge.oldest || unclaimedAge.oldest.length === 0) && (
              <div className="flex flex-col items-center justify-center py-6 text-gray-600">
                <FaCheckCircle size={20} className="mb-2 opacity-30" />
                <p className="text-sm">All items claimed!</p>
              </div>
            )}
          </div>
        </div>

        {/* Lost vs Found Match Rate */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-white text-sm font-semibold">Lost vs Found Match Rate</h3>
            <p className="text-gray-500 text-xs mt-0.5">Percentage of lost items that were eventually resolved</p>
          </div>
          <div className="p-5 space-y-4">
            {/* Big match rate */}
            <div className="text-center py-2">
              <p className="text-6xl font-bold text-emerald-400 tracking-tight">{matchRate.matchRate ?? 0}%</p>
              <p className="text-gray-400 text-sm mt-2">of lost items resolved</p>
            </div>
            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Resolved ({matchRate.totalResolved ?? 0})</span>
                <span>Unresolved ({matchRate.unresolved ?? 0})</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(matchRate.matchRate ?? 0, 100)}%` }}
                />
              </div>
            </div>
            {/* Monthly resolved trend */}
            <div className="h-36 pt-2">
              <p className="text-gray-600 text-[10px] uppercase tracking-widest font-medium mb-2">Monthly resolved items</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyStats} margin={{ top: 0, right: 10, left: -30, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="resolved" name="Resolved" fill="#34d399" radius={[3,3,0,0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5">
              <div className="bg-emerald-400/5 border border-emerald-400/10 rounded-xl p-3 text-center">
                <p className="text-emerald-400 text-xl font-bold">{matchRate.totalResolved ?? 0}</p>
                <p className="text-gray-600 text-[10px] mt-0.5">Resolved</p>
              </div>
              <div className="bg-red-400/5 border border-red-400/10 rounded-xl p-3 text-center">
                <p className="text-red-400 text-xl font-bold">{matchRate.unresolved ?? 0}</p>
                <p className="text-gray-600 text-[10px] mt-0.5">Still Lost</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown + Right column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-white text-sm font-semibold">Category Breakdown</h3>
            <p className="text-gray-500 text-xs mt-0.5">Items reported per category · cyan = found · red = lost</p>
          </div>
          {catBreakdown.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-12">No category data yet</p>
          ) : (
            <>
              <div className="p-5 space-y-3.5">
                {catBreakdown.map((cat: any) => {
                  const maxTotal = catBreakdown[0]?.total || 1;
                  const pct      = Math.round((cat.total / maxTotal) * 100);
                  return (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-white text-xs font-medium">{cat.name}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-cyan-400 text-[10px]">{cat.found}f</span>
                          <span className="text-red-400   text-[10px]">{cat.lost}l</span>
                          <span className="text-gray-300  text-xs font-bold w-6 text-right">{cat.total}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full flex rounded-full overflow-hidden" style={{ width: `${pct}%` }}>
                          {cat.found > 0 && <div className="bg-cyan-500 h-full" style={{ width: `${Math.round((cat.found / cat.total) * 100)}%` }} />}
                          {cat.lost  > 0 && <div className="bg-red-500  h-full" style={{ width: `${Math.round((cat.lost  / cat.total) * 100)}%` }} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-3 pb-5 h-52 border-t border-white/5 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={catBreakdown} margin={{ top: 5, right: 10, left: -30, bottom: 24 }} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" interval={0} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="found" name="Found" fill="#22d3ee" radius={[3,3,0,0]} maxBarSize={22} stackId="a" />
                    <Bar dataKey="lost"  name="Lost"  fill="#f87171" radius={[3,3,0,0]} maxBarSize={22} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {/* Avg Claim Resolution */}
          <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-400/10 border border-violet-400/20 flex items-center justify-center shrink-0">
                <FaClock size={14} className="text-violet-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Avg. Resolution Time</p>
                <p className="text-gray-500 text-[10px]">Claim approval / rejection</p>
              </div>
            </div>
            <div className="text-center py-2">
              {stats?.avgClaimResolutionDays != null ? (
                <>
                  <p className="text-5xl font-bold text-violet-400 tracking-tight">{stats.avgClaimResolutionDays}</p>
                  <p className="text-gray-400 text-sm mt-1.5 font-medium">days on average</p>
                  <p className="text-gray-600 text-[11px] mt-3">Based on {(stats?.approvedClaims ?? 0) + (stats?.rejectedClaims ?? 0)} resolved claims</p>
                </>
              ) : (
                <div className="py-4">
                  <p className="text-gray-600 text-sm">No resolved claims yet</p>
                  <p className="text-gray-700 text-xs mt-1">Data will appear once claims are approved or rejected</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
              <div className="bg-emerald-400/5 border border-emerald-400/10 rounded-xl p-3 text-center">
                <p className="text-emerald-400 text-lg font-bold">{stats?.approvedClaims ?? 0}</p>
                <p className="text-gray-600 text-[10px] mt-0.5">Approved</p>
              </div>
              <div className="bg-red-400/5 border border-red-400/10 rounded-xl p-3 text-center">
                <p className="text-red-400 text-lg font-bold">{stats?.rejectedClaims ?? 0}</p>
                <p className="text-gray-600 text-[10px] mt-0.5">Rejected</p>
              </div>
            </div>
          </div>

          {/* Top Reporters */}
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden flex-1">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-white text-sm font-semibold">Top Reporters</h3>
              <p className="text-gray-500 text-xs mt-0.5">Most found items reported</p>
            </div>
            <div className="divide-y divide-white/5">
              {topReporters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-600">
                  <FaTrophy size={22} className="mb-2 opacity-30" />
                  <p className="text-sm">No reporters yet</p>
                </div>
              ) : topReporters.map((r: any, i: number) => {
                const m = medalColor(i);
                return (
                  <div key={r.name} className="flex items-center gap-3 px-5 py-3.5">
                    <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${m.bg}`}>{m.icon}</div>
                    <p className="flex-1 text-white text-xs font-medium truncate">{r.name}</p>
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-bold ${m.text}`}>{r.count}</span>
                      <span className="text-gray-600 text-[10px]">items</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;