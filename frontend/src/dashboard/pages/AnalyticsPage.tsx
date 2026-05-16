import { useState } from "react";
import {
  FaTrophy, FaMedal, FaClock,
  FaBoxOpen, FaCheckCircle, FaPrint,
  FaUsers, FaChartLine, FaExchangeAlt, FaTachometerAlt,
  FaArrowDown, FaUserCheck, FaUserSlash,
  FaShieldAlt, FaBrain, FaMapMarkerAlt, FaExclamationCircle, FaBolt,
} from "react-icons/fa";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useAdminStatsQuery } from "../../redux/api/api";
import ExportButton, { printAnalyticsReport } from "../../components/export/ExportButton";

// ── Shared helpers ────────────────────────────────────────────────────────────

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
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all focus:outline-none ${active ? "bg-cyan-500/10 text-cyan-400" : "text-gray-500 hover:text-white"
      }`}
  >
    {label}
  </button>
);

const StatCard = ({ label, value, sub, color = "text-cyan-400", bg = "bg-cyan-400/10 border-cyan-400/20", icon }: any) => (
  <div className={`rounded-2xl border p-4 flex flex-col gap-1 bg-gray-900 h-[96px] ${bg}`}>
    {icon && <div className="mb-1">{icon}</div>}
    <p className={`text-2xl sm:text-3xl font-bold ${color}`}>{value}</p>
    <p className="text-gray-500 text-xs font-medium">{label}</p>
    {sub && <p className="text-gray-600 text-[10px]">{sub}</p>}
  </div>
);

const SectionCard = ({ title, subtitle, children, action }: any) => (
  <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
      <div>
        <h3 className="text-white text-sm font-semibold">{title}</h3>
        {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const HealthBar = ({ value, color }: { value: number; color: string }) => (
  <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-700 ${color}`}
      style={{ width: `${Math.min(value, 100)}%` }}
    />
  </div>
);

const medalColor = (i: number) => {
  if (i === 0) return { bg: "bg-yellow-400/10 border-yellow-400/20", text: "text-yellow-400", icon: <FaTrophy size={12} className="text-yellow-400" /> };
  if (i === 1) return { bg: "bg-gray-400/10 border-gray-400/20", text: "text-gray-300", icon: <FaMedal size={12} className="text-gray-300" /> };
  if (i === 2) return { bg: "bg-orange-400/10 border-orange-400/20", text: "text-orange-400", icon: <FaMedal size={12} className="text-orange-400" /> };
  return { bg: "bg-white/5 border-white/5", text: "text-gray-500", icon: <span className="text-gray-600 text-xs font-bold w-3 text-center">{i + 1}</span> };
};

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview", icon: FaChartLine },
  { id: "users", label: "User Activity", icon: FaUsers },
  { id: "flow", label: "Item Flow", icon: FaExchangeAlt },
  { id: "performance", label: "Performance", icon: FaTachometerAlt },
  { id: "predictive", label: "Predictive AI", icon: FaBrain },
];

// ════════════════════════════════════════════════════════════════════════════════
// TAB: OVERVIEW
// ════════════════════════════════════════════════════════════════════════════════
const OverviewTab = ({ stats }: { stats: any }) => {
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [peakView, setPeakView] = useState<"days" | "hours">("days");

  const monthlyStats = stats?.monthlyStats || [];
  const topReporters = stats?.topReporters || [];
  const catBreakdown = stats?.categoryBreakdown || [];
  const peakDays = stats?.peakReportingDays || [];
  const peakHours = stats?.peakReportingHours || [];
  const unclaimedAge = stats?.unclaimedItemsAge || {};
  const matchRate = stats?.lostFoundMatchRate || {};

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary stat pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Found", value: stats?.foundItems ?? 0, color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20" },
          { label: "Total Lost", value: stats?.lostItems ?? 0, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
          { label: "Total Claims", value: stats?.totalClaims ?? 0, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
          { label: "Claimed Items", value: stats?.claimedItems ?? 0, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 flex flex-col gap-1 h-[96px] ${s.bg} bg-gray-900`}>
            <p className={`text-2xl sm:text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly Trends Chart */}
      <SectionCard
        title="Monthly Trends"
        subtitle="Found items, lost reports & claims per month"
        action={
          <div className="flex gap-1 bg-gray-800 border border-white/5 rounded-lg p-1">
            <ChartToggle active={chartType === "area"} label="Area" onClick={() => setChartType("area")} />
            <ChartToggle active={chartType === "bar"} label="Bar" onClick={() => setChartType("bar")} />
          </div>
        }
      >
        <div className="flex items-center gap-4 px-5 pt-4">
          {[
            { color: "#22d3ee", label: "Found Items" },
            { color: "#f87171", label: "Lost Reports" },
            { color: "#facc15", label: "Claims" },
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
                  <linearGradient id="gFound" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} /><stop offset="95%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gLost" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f87171" stopOpacity={0.25} /><stop offset="95%" stopColor="#f87171" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gClaims" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#facc15" stopOpacity={0.2} /><stop offset="95%" stopColor="#facc15" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="found" name="Found" stroke="#22d3ee" strokeWidth={2} fill="url(#gFound)" dot={{ fill: "#22d3ee", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="lost" name="Lost" stroke="#f87171" strokeWidth={2} fill="url(#gLost)" dot={{ fill: "#f87171", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
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
                <Bar dataKey="found" name="Found" fill="#22d3ee" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="lost" name="Lost" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="claims" name="Claims" fill="#facc15" radius={[4, 4, 0, 0]} maxBarSize={28} />
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
                { label: "Found this month", value: last.found, color: "text-cyan-400", field: "found" as const },
                { label: "Lost this month", value: last.lost, color: "text-red-400", field: "lost" as const },
                { label: "Claims this month", value: last.claims, color: "text-yellow-400", field: "claims" as const },
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
      </SectionCard>

      {/* Resolution Rate Trend */}
      <SectionCard title="Resolution Rate Trend" subtitle="% of lost items resolved per month · resolved items vs lost reports">
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
        <div className="grid grid-cols-3 border-t border-white/5">
          {[
            { label: "Overall Match Rate", value: `${matchRate.matchRate ?? 0}%`, color: "text-violet-400" },
            { label: "Total Resolved", value: matchRate.totalResolved ?? 0, color: "text-emerald-400" },
            { label: "Still Unresolved", value: matchRate.unresolved ?? 0, color: "text-red-400" },
          ].map((s, i) => (
            <div key={i} className={`px-5 py-4 flex flex-col gap-1 ${i > 0 ? "border-l border-white/5" : ""}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-600 text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Peak Reporting Times */}
      <SectionCard
        title="Peak Reporting Times"
        subtitle="When items are most commonly reported lost or found"
        action={
          <div className="flex gap-1 bg-gray-800 border border-white/5 rounded-lg p-1">
            <ChartToggle active={peakView === "days"} label=" Day" onClick={() => setPeakView("days")} />
            <ChartToggle active={peakView === "hours"} label=" Hour" onClick={() => setPeakView("hours")} />
          </div>
        }
      >
        <div className="px-2 pb-4 pt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peakView === "days" ? peakDays : peakHours} margin={{ top: 5, right: 20, left: -20, bottom: 0 }} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey={peakView === "days" ? "day" : "label"}
                tick={peakView === "hours"
                  ? ({ x, y, payload }) => {
                    const lines = (payload.value as string).split("\n");
                    return (
                      <g transform={`translate(${x},${y})`}>
                        {lines.map((line: string, i: number) => (
                          <text key={i} x={0} y={0} dy={10 + i * 11} textAnchor="middle" fill="#6b7280" fontSize={9}>{line}</text>
                        ))}
                      </g>
                    );
                  }
                  : { fill: "#6b7280", fontSize: 10 }
                }
                axisLine={false} tickLine={false} interval={0} height={peakView === "hours" ? 40 : 20}
              />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="found" name="Found" fill="#22d3ee" radius={[3, 3, 0, 0]} maxBarSize={24} stackId="a" />
              <Bar dataKey="lost" name="Lost" fill="#f87171" radius={[3, 3, 0, 0]} maxBarSize={24} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {(() => {
          const data = peakView === "days" ? peakDays : peakHours;
          const busiest = [...data].sort((a: any, b: any) => b.total - a.total)[0];
          if (!busiest || busiest.total === 0) return null;
          const displayKey = peakView === "days" ? "day" : "label";
          const displayName = peakView === "hours"
            ? (busiest[displayKey] as string).split("\n")[0]
            : busiest[displayKey];
          return (
            <div className="px-5 py-3 border-t border-white/5 flex items-center gap-2">
              <span className="text-yellow-400 text-xs font-semibold">⚡ Busiest {peakView === "days" ? "day" : "time block"}:</span>
              <span className="text-white text-xs font-bold">{displayName}</span>
              <span className="text-gray-500 text-xs">— {busiest.total} reports</span>
            </div>
          );
        })()}
      </SectionCard>

      {/* Unclaimed Items Age + Match Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Unclaimed Items Age" subtitle="How long found items have been sitting unclaimed">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "7+ days", value: unclaimedAge.over7days ?? 0, color: "text-yellow-400", bg: "bg-yellow-400/5 border-yellow-400/10" },
                { label: "30+ days", value: unclaimedAge.over30days ?? 0, color: "text-orange-400", bg: "bg-orange-400/5 border-orange-400/10" },
                { label: "90+ days", value: unclaimedAge.over90days ?? 0, color: "text-red-400", bg: "bg-red-400/5 border-red-400/10" },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-gray-600 text-[10px] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between bg-gray-800/60 rounded-xl p-3 border border-white/5">
              <span className="text-gray-400 text-xs">Avg. age of unclaimed items</span>
              <span className="text-white text-sm font-bold">{unclaimedAge.avgAgeDays ?? 0} days</span>
            </div>
            {unclaimedAge.oldest?.length > 0 ? (
              <div className="space-y-2">
                <p className="text-gray-600 text-[10px] uppercase tracking-widest font-medium">Oldest unclaimed</p>
                {unclaimedAge.oldest.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FaBoxOpen size={10} className="text-gray-500 shrink-0" />
                      <p className="text-gray-300 text-xs truncate">{item.name}</p>
                      <p className="text-gray-600 text-[10px] truncate shrink-0">· {item.location}</p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.days >= 90 ? "bg-red-400/10 text-red-400" :
                      item.days >= 30 ? "bg-orange-400/10 text-orange-400" :
                        "bg-yellow-400/10 text-yellow-400"
                      }`}>{item.days}d</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-gray-600">
                <FaCheckCircle size={20} className="mb-2 opacity-30" />
                <p className="text-sm">All items claimed!</p>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Lost vs Found Match Rate" subtitle="Percentage of lost items that were eventually resolved">
          <div className="p-5 space-y-4">
            <div className="text-center py-2">
              <p className="text-6xl font-bold text-emerald-400 tracking-tight">{matchRate.matchRate ?? 0}%</p>
              <p className="text-gray-400 text-sm mt-2">of lost items resolved</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Resolved ({matchRate.totalResolved ?? 0})</span>
                <span>Unresolved ({matchRate.unresolved ?? 0})</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(matchRate.matchRate ?? 0, 100)}%` }} />
              </div>
            </div>
            <div className="h-36 pt-2">
              <p className="text-gray-600 text-[10px] uppercase tracking-widest font-medium mb-2">Monthly resolved items</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyStats} margin={{ top: 0, right: 10, left: -30, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="resolved" name="Resolved" fill="#34d399" radius={[3, 3, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
        </SectionCard>
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
                  const pct = Math.round((cat.total / maxTotal) * 100);
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
                          {cat.lost > 0 && <div className="bg-red-500  h-full" style={{ width: `${Math.round((cat.lost / cat.total) * 100)}%` }} />}
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
                    <Bar dataKey="found" name="Found" fill="#22d3ee" radius={[3, 3, 0, 0]} maxBarSize={22} stackId="a" />
                    <Bar dataKey="lost" name="Lost" fill="#f87171" radius={[3, 3, 0, 0]} maxBarSize={22} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-4">
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

          <SectionCard title="Top Reporters" subtitle="Most found items reported">
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
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// TAB: USER ACTIVITY
// ════════════════════════════════════════════════════════════════════════════════
const UserActivityTab = ({ stats }: { stats: any }) => {
  const regTrend = stats?.userRegistrationTrend || [];
  const roleBreakdown = stats?.userRoleBreakdown || {};
  const statusBreakdown = stats?.userStatusBreakdown || {};
  const engagement = stats?.userEngagement || {};
  const topClaimants = stats?.topClaimants || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Users" value={stats?.totalUsers ?? 0} color="text-cyan-400" bg="bg-cyan-400/10 border-cyan-400/20" />
        <StatCard label="New This Month" value={stats?.newUsersThisMonth ?? 0} color="text-emerald-400" bg="bg-emerald-400/10 border-emerald-400/20"
          sub={`+${stats?.newUsersThisWeek ?? 0} this week`} />
        <StatCard label="Active Users" value={statusBreakdown.active ?? 0} color="text-violet-400" bg="bg-violet-400/10 border-violet-400/20" />
        <StatCard label="Engagement Rate" value={`${engagement.engagementRate ?? 0}%`} color="text-yellow-400" bg="bg-yellow-400/10 border-yellow-400/20"
          sub={`${engagement.engagedUsers ?? 0} active submitters`} />
      </div>

      {/* Registration Trend */}
      <SectionCard title="Registration Trend" subtitle="New user registrations over the last 6 months">
        <div className="px-2 pb-4 pt-4 h-64">
          {regTrend.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={regTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAdmin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="registrations" name="Total" stroke="#22d3ee" strokeWidth={2} fill="url(#gReg)" dot={{ fill: "#22d3ee", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="users" name="Users" stroke="#34d399" strokeWidth={1.5} fill="none" dot={false} strokeDasharray="4 2" />
                <Area type="monotone" dataKey="admins" name="Admins" stroke="#a78bfa" strokeWidth={1.5} fill="url(#gAdmin)" dot={{ fill: "#a78bfa", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </SectionCard>

      {/* Role & Status breakdowns + Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Role Breakdown */}
        <SectionCard title="Role Breakdown" subtitle="Admin vs regular users">
          <div className="p-5 space-y-4">
            {[
              { label: "Regular Users", value: roleBreakdown.users ?? 0, color: "text-cyan-400", bar: "bg-cyan-500", pct: roleBreakdown.total > 0 ? Math.round(((roleBreakdown.users ?? 0) / roleBreakdown.total) * 100) : 0 },
              { label: "Admins", value: roleBreakdown.admins ?? 0, color: "text-violet-400", bar: "bg-violet-500", pct: roleBreakdown.total > 0 ? Math.round(((roleBreakdown.admins ?? 0) / roleBreakdown.total) * 100) : 0 },
            ].map(r => (
              <div key={r.label} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">{r.label}</span>
                  <span className={`text-sm font-bold ${r.color}`}>{r.value} <span className="text-gray-600 font-normal text-[10px]">({r.pct}%)</span></span>
                </div>
                <HealthBar value={r.pct} color={r.bar} />
              </div>
            ))}
            <div className="pt-2 border-t border-white/5 text-center">
              <p className="text-gray-600 text-[10px]">Total: {roleBreakdown.total ?? 0} registered users</p>
            </div>
          </div>
        </SectionCard>

        {/* Account Status */}
        <SectionCard title="Account Status" subtitle="Active, blocked & deleted">
          <div className="p-5 space-y-4">
            {(() => {
              const total = (statusBreakdown.active ?? 0) + (statusBreakdown.blocked ?? 0) + (statusBreakdown.deleted ?? 0);
              return [
                { label: "Active", value: statusBreakdown.active ?? 0, icon: <FaUserCheck size={12} className="text-emerald-400" />, color: "text-emerald-400", bar: "bg-emerald-500", pct: total > 0 ? Math.round(((statusBreakdown.active ?? 0) / total) * 100) : 0 },
                { label: "Blocked", value: statusBreakdown.blocked ?? 0, icon: <FaUserSlash size={12} className="text-orange-400" />, color: "text-orange-400", bar: "bg-orange-500", pct: total > 0 ? Math.round(((statusBreakdown.blocked ?? 0) / total) * 100) : 0 },
                { label: "Deleted", value: statusBreakdown.deleted ?? 0, icon: <FaUserSlash size={12} className="text-red-400" />, color: "text-red-400", bar: "bg-red-500", pct: total > 0 ? Math.round(((statusBreakdown.deleted ?? 0) / total) * 100) : 0 },
              ].map(s => (
                <div key={s.label} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">{s.icon}<span className="text-gray-400 text-xs">{s.label}</span></div>
                    <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                  </div>
                  <HealthBar value={s.pct} color={s.bar} />
                </div>
              ));
            })()}
          </div>
        </SectionCard>

        {/* Engagement */}
        <SectionCard title="User Engagement" subtitle="Users who submitted items">
          <div className="p-5 space-y-4">
            <div className="text-center py-2">
              <p className="text-5xl font-bold text-cyan-400">{engagement.engagementRate ?? 0}%</p>
              <p className="text-gray-400 text-sm mt-2">engagement rate</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Engaged ({engagement.engagedUsers ?? 0})</span>
                <span>Dormant ({engagement.dormantUsers ?? 0})</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(engagement.engagementRate ?? 0, 100)}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
              <div className="bg-cyan-400/5 border border-cyan-400/10 rounded-xl p-3 text-center">
                <p className="text-cyan-400 text-lg font-bold">{engagement.engagedUsers ?? 0}</p>
                <p className="text-gray-600 text-[10px] mt-0.5">Engaged</p>
              </div>
              <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3 text-center">
                <p className="text-gray-400 text-lg font-bold">{engagement.dormantUsers ?? 0}</p>
                <p className="text-gray-600 text-[10px] mt-0.5">Dormant</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Top Claimants */}
      <SectionCard title="Top Claimants" subtitle="Users who submitted the most claims">
        <div className="divide-y divide-white/5">
          {topClaimants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-600">
              <FaUsers size={22} className="mb-2 opacity-30" />
              <p className="text-sm">No claim data yet</p>
            </div>
          ) : topClaimants.map((r: any, i: number) => {
            const m = medalColor(i);
            const approvalPct = r.count > 0 ? Math.round((r.approved / r.count) * 100) : 0;
            return (
              <div key={r.name} className="flex items-center gap-3 px-5 py-3.5">
                <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${m.bg}`}>{m.icon}</div>
                <p className="flex-1 text-white text-xs font-medium truncate">{r.name}</p>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-gray-500 text-[10px]">Approved</p>
                    <p className="text-emerald-400 text-xs font-bold">{r.approved} <span className="text-gray-600 font-normal">({approvalPct}%)</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-[10px]">Total</p>
                    <p className={`text-sm font-bold ${m.text}`}>{r.count}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// TAB: ITEM FLOW
// ════════════════════════════════════════════════════════════════════════════════
const ItemFlowTab = ({ stats }: { stats: any }) => {
  const funnel = stats?.itemFlowFunnel || {};
  const monthly = stats?.itemFlowMonthly || [];
  const catRates = stats?.categoryClaimRates || [];

  const funnelSteps = [
    { label: "Lost Reported", value: funnel.lostReported ?? 0, color: "bg-red-500/20 border-red-500/30", text: "text-red-400", next: `${funnel.lostToFound ?? 0}% became found reports` },
    { label: "Found Reported", value: funnel.foundReported ?? 0, color: "bg-cyan-500/20 border-cyan-500/30", text: "text-cyan-400", next: `${funnel.foundToClaim ?? 0}% received a claim` },
    { label: "Claims Submitted", value: funnel.claimsSubmitted ?? 0, color: "bg-yellow-500/20 border-yellow-500/30", text: "text-yellow-400", next: `${funnel.claimToApproval ?? 0}% were approved` },
    { label: "Claims Approved", value: funnel.claimsApproved ?? 0, color: "bg-emerald-500/20 border-emerald-500/30", text: "text-emerald-400", next: null },
  ];

  const maxVal = Math.max(...funnelSteps.map(s => s.value), 1);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Lost → Found Rate" value={`${funnel.lostToFound ?? 0}%`} color="text-cyan-400" bg="bg-cyan-400/10 border-cyan-400/20" />
        <StatCard label="Found → Claim Rate" value={`${funnel.foundToClaim ?? 0}%`} color="text-yellow-400" bg="bg-yellow-400/10 border-yellow-400/20" />
        <StatCard label="Claim Approval Rate" value={`${funnel.claimToApproval ?? 0}%`} color="text-emerald-400" bg="bg-emerald-400/10 border-emerald-400/20" />
        <StatCard label="Overall Recovery" value={`${funnel.overallRecovery ?? 0}%`} color="text-violet-400" bg="bg-violet-400/10 border-violet-400/20"
          sub="Lost → Approved claim" />
      </div>

      {/* Visual Funnel */}
      <SectionCard title="Recovery Funnel" subtitle="Item journey from lost report to successful claim">
        <div className="p-6 space-y-3">
          {funnelSteps.map((step) => {
            const width = maxVal > 0 ? Math.max(Math.round((step.value / maxVal) * 100), 8) : 8;
            return (
              <div key={step.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">{step.label}</span>
                  <span className={`font-bold text-sm ${step.text}`}>{step.value}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-lg h-9 overflow-hidden flex items-center">
                  <div
                    className={`h-full rounded-lg border flex items-center px-3 transition-all duration-700 ${step.color}`}
                    style={{ width: `${width}%`, minWidth: "2rem" }}
                  >
                    <span className={`text-xs font-bold ${step.text} whitespace-nowrap`}>{step.value}</span>
                  </div>
                </div>
                {step.next && (
                  <div className="flex items-center gap-1.5 pl-2">
                    <FaArrowDown size={8} className="text-gray-700" />
                    <span className="text-gray-700 text-[10px]">{step.next}</span>
                  </div>
                )}
              </div>
            );
          })}
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between bg-violet-500/5 rounded-xl px-4 py-3 ring-1 ring-violet-500/20">
            <div className="flex items-center gap-2">
              <FaShieldAlt size={14} className="text-violet-400" />
              <span className="text-white text-sm font-semibold">Overall Recovery Rate</span>
            </div>
            <span className="text-violet-400 text-2xl font-bold">{funnel.overallRecovery ?? 0}%</span>
          </div>
        </div>
      </SectionCard>

      {/* Monthly Item Flow */}
      <SectionCard title="Monthly Item Flow" subtitle="Found items, claimed items and pending claims per month">
        <div className="flex items-center gap-4 px-5 pt-4">
          {[{ color: "#22d3ee", label: "Found" }, { color: "#34d399", label: "Claimed" }, { color: "#f87171", label: "Lost" }].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: l.color }} />
              <span className="text-gray-400 text-xs">{l.label}</span>
            </div>
          ))}
        </div>
        <div className="px-2 pb-4 pt-2 h-64">
          {monthly.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 10, right: 20, left: -20, bottom: 0 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="found" name="Found" fill="#22d3ee" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="claimed" name="Claimed" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="lost" name="Lost" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </SectionCard>

      {/* Category Claim Rates */}
      <SectionCard title="Claim Success by Category" subtitle="Which item categories get claimed most often">
        {catRates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-600">
            <FaBoxOpen size={24} className="mb-2 opacity-30" />
            <p className="text-sm">No claim data yet</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {catRates.map((cat: any, i: number) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-[10px] font-bold w-4">{i + 1}</span>
                    <p className="text-white text-xs font-medium">{cat.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-[10px]">{cat.claimed}/{cat.found} claimed</span>
                    <span className={`text-xs font-bold ${cat.rate >= 70 ? "text-emerald-400" : cat.rate >= 40 ? "text-yellow-400" : "text-red-400"}`}>{cat.rate}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${cat.rate >= 70 ? "bg-emerald-500" : cat.rate >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${cat.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// TAB: PERFORMANCE
// ════════════════════════════════════════════════════════════════════════════════
const PerformanceTab = ({ stats }: { stats: any }) => {
  const pendingAge = stats?.pendingClaimsAge || {};
  const weeklyTP = stats?.weeklyThroughput || [];
  const healthScore = stats?.systemHealthScore ?? 0;

  const healthColor = healthScore >= 75 ? "text-emerald-400" : healthScore >= 50 ? "text-yellow-400" : "text-red-400";
  const healthBarColor = healthScore >= 75 ? "bg-emerald-500" : healthScore >= 50 ? "bg-yellow-500" : "bg-red-500";
  const healthBg = healthScore >= 75 ? "bg-emerald-400/10 border-emerald-400/20" : healthScore >= 50 ? "bg-yellow-400/10 border-yellow-400/20" : "bg-red-400/10 border-red-400/20";
  const healthLabel = healthScore >= 75 ? "Healthy" : healthScore >= 50 ? "Needs Attention" : "Critical";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="System Health" value={`${healthScore}/100`} color={healthColor} bg={healthBg} sub={healthLabel} />
        <StatCard label="Avg Resolution" value={stats?.avgClaimResolutionDays != null ? `${stats.avgClaimResolutionDays}d` : "—"} color="text-violet-400" bg="bg-violet-400/10 border-violet-400/20" sub="Claim approval time" />
        <StatCard label="Approval Rate" value={`${stats?.claimApprovalRate ?? 0}%`} color="text-emerald-400" bg="bg-emerald-400/10 border-emerald-400/20" sub={`${stats?.approvedClaims ?? 0} approved`} />
        <StatCard label="Pending Backlog" value={stats?.pendingClaims ?? 0} color="text-orange-400" bg="bg-orange-400/10 border-orange-400/20" sub={`${pendingAge.over7days ?? 0} older than 7 days`} />
      </div>

      {/* System Health Score */}
      <SectionCard title="System Health Score" subtitle="Composite score based on claim backlog, approval rate, resolution rate and item age">
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-6">
            <div className="text-center shrink-0">
              <p className={`text-6xl font-bold ${healthColor}`}>{healthScore}</p>
              <p className="text-gray-500 text-xs mt-1">out of 100</p>
            </div>
            <div className="flex-1 space-y-3">
              {[
                { label: "Claim Backlog", value: stats?.totalClaims > 0 ? Math.max(0, 100 - Math.round((stats?.pendingClaims / stats?.totalClaims) * 100)) : 100, hint: "Low pending claims = high score" },
                { label: "Approval Rate", value: stats?.claimApprovalRate ?? 0, hint: "Higher approval = better" },
                { label: "Resolution Rate", value: stats?.resolutionRate ?? 0, hint: "More lost items found = better" },
                { label: "Item Freshness", value: Math.max(0, 100 - Math.round(((stats?.unclaimedItemsAge?.avgAgeDays ?? 0) / 30) * 100)), hint: "Lower avg unclaimed age = better" },
              ].map(f => (
                <div key={f.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">{f.label}</span>
                    <span className="text-white font-semibold">{f.value}%</span>
                  </div>
                  <HealthBar value={f.value} color={f.value >= 70 ? "bg-emerald-500" : f.value >= 40 ? "bg-yellow-500" : "bg-red-500"} />
                  <p className="text-gray-700 text-[10px]">{f.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Weekly Throughput */}
      <SectionCard title="Weekly Throughput" subtitle="Items and claims processed per week over the last 6 weeks">
        <div className="px-2 pb-4 pt-4 h-64">
          {weeklyTP.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTP} margin={{ top: 10, right: 20, left: -20, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="found" name="Found" fill="#22d3ee" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="lost" name="Lost" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="claims" name="Claims" fill="#facc15" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="grid grid-cols-3 border-t border-white/5">
          {[
            { label: "Items / User", value: stats?.itemsPerUser ?? 0, color: "text-cyan-400" },
            { label: "Claims / Item", value: stats?.claimRatePerItem ?? 0, color: "text-yellow-400" },
            { label: "Rejection Rate", value: `${stats?.claimRejectionRate ?? 0}%`, color: "text-red-400" },
          ].map((s, i) => (
            <div key={i} className={`px-5 py-4 flex flex-col gap-1 ${i > 0 ? "border-l border-white/5" : ""}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-600 text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Pending Claims Age + Resolution Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Pending Claims Backlog" subtitle="How long claims have been waiting for review">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "3+ days", value: pendingAge.over3days ?? 0, color: "text-yellow-400", bg: "bg-yellow-400/5 border-yellow-400/10" },
                { label: "7+ days", value: pendingAge.over7days ?? 0, color: "text-orange-400", bg: "bg-orange-400/5 border-orange-400/10" },
                { label: "14+ days", value: pendingAge.over14days ?? 0, color: "text-red-400", bg: "bg-red-400/5 border-red-400/10" },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-gray-600 text-[10px] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between bg-gray-800/60 rounded-xl p-3 border border-white/5">
              <span className="text-gray-400 text-xs">Avg. age of pending claims</span>
              <span className="text-white text-sm font-bold">{pendingAge.avgAgeDays ?? 0} days</span>
            </div>
            {(pendingAge.oldest ?? []).length > 0 ? (
              <div className="space-y-2">
                <p className="text-gray-600 text-[10px] uppercase tracking-widest font-medium">Oldest pending claims</p>
                {(pendingAge.oldest ?? []).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FaClock size={10} className="text-gray-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-gray-300 text-xs truncate">{c.claimantName}</p>
                        <p className="text-gray-600 text-[10px] truncate">→ {c.itemName}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.ageDays >= 14 ? "bg-red-400/10 text-red-400" :
                      c.ageDays >= 7 ? "bg-orange-400/10 text-orange-400" :
                        "bg-yellow-400/10 text-yellow-400"
                      }`}>{c.ageDays}d</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-gray-600">
                <FaCheckCircle size={20} className="mb-2 opacity-30" />
                <p className="text-sm">No pending claims!</p>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Claim Resolution Performance" subtitle="Approval vs rejection breakdown over resolved claims">
          <div className="p-5 space-y-4">
            <div className="text-center py-2">
              {stats?.avgClaimResolutionDays != null ? (
                <>
                  <p className="text-6xl font-bold text-violet-400">{stats.avgClaimResolutionDays}</p>
                  <p className="text-gray-400 text-sm mt-1.5">days avg resolution time</p>
                  <p className="text-gray-600 text-[11px] mt-2">Based on {(stats?.approvedClaims ?? 0) + (stats?.rejectedClaims ?? 0)} resolved claims</p>
                </>
              ) : (
                <div className="py-6">
                  <p className="text-gray-600 text-sm">No resolved claims yet</p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {[
                { label: "Approval Rate", value: stats?.claimApprovalRate ?? 0, color: "text-emerald-400", bar: "bg-emerald-500" },
                { label: "Rejection Rate", value: stats?.claimRejectionRate ?? 0, color: "text-red-400", bar: "bg-red-500" },
              ].map(r => (
                <div key={r.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">{r.label}</span>
                    <span className={`font-bold ${r.color}`}>{r.value}%</span>
                  </div>
                  <HealthBar value={r.value} color={r.bar} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
              <div className="bg-emerald-400/5 border border-emerald-400/10 rounded-xl p-3 text-center">
                <p className="text-emerald-400 text-xl font-bold">{stats?.approvedClaims ?? 0}</p>
                <p className="text-gray-600 text-[10px] mt-0.5">Approved</p>
              </div>
              <div className="bg-red-400/5 border border-red-400/10 rounded-xl p-3 text-center">
                <p className="text-red-400 text-xl font-bold">{stats?.rejectedClaims ?? 0}</p>
                <p className="text-gray-600 text-[10px] mt-0.5">Rejected</p>
              </div>
            </div>
            {stats?.avgFoundToClaimDays != null && (
              <div className="flex items-center justify-between bg-gray-800/60 rounded-xl p-3 border border-white/5">
                <span className="text-gray-400 text-xs">Avg. time from found → claimed</span>
                <span className="text-cyan-400 text-sm font-bold">{stats.avgFoundToClaimDays} days</span>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// TAB: PREDICTIVE AI
// ════════════════════════════════════════════════════════════════════════════════
const PatrolRouteModal = ({ isOpen, onClose, zones }: { isOpen: boolean; onClose: () => void; zones: any[] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FaBolt className="text-white animate-pulse" size={14} />
            <h3 className="text-white font-black uppercase tracking-widest text-[11px]">Optimized Patrol Route</h3>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <FaExclamationCircle className="rotate-45" size={16} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
              <FaBrain size={14} className="text-violet-400" />
            </div>
            <div>
              <p className="text-white text-[10px] font-bold">AI Strategy</p>
              <p className="text-gray-400 text-[9px] leading-relaxed mt-0.5">
                Route optimized to cover <span className="text-violet-300">{zones.length} hotspots</span>.
              </p>
            </div>
          </div>

          <div className="relative space-y-4 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-violet-500 before:via-indigo-500 before:to-transparent">
            {zones.map((zone, i) => (
              <div key={zone.name} className="relative flex items-center gap-4 group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 transition-transform group-hover:scale-110 ${i === 0 ? "bg-violet-500 shadow-lg shadow-violet-500/50" : "bg-gray-800 border border-white/10"
                  }`}>
                  <span className="text-white text-[10px] font-black">{i + 1}</span>
                </div>
                <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-3 hover:bg-white/[0.08] transition-all">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-white text-[11px] font-bold">{zone.name}</h4>
                    <span className="text-violet-400 text-[9px] font-black uppercase tracking-widest">
                      {60 + (i * 15)}m
                    </span>
                  </div>
                  <p className="text-gray-500 text-[8px] mb-1.5 uppercase font-bold tracking-tighter">
                    {zone.riskScore}% Probability
                  </p>
                  <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-medium">
                    <FaCheckCircle size={7} />
                    <span>Focus: Unattended items check</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-gray-900 border-t border-white/5 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all border border-white/5 shadow-lg"
          >
            Acknowledge Route
          </button>
        </div>
      </div>
    </div>
  );
};

const PredictiveTab = ({ stats }: { stats: any }) => {
  const data = stats?.predictiveAnalytics;
  const [isPatrolling, setIsPatrolling] = useState(false);
  const [patrolGenerated, setPatrolGenerated] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);

  const handleGeneratePatrol = () => {
    if (patrolGenerated) {
      setShowRouteModal(true);
      return;
    }
    setIsPatrolling(true);
    setTimeout(() => {
      setIsPatrolling(false);
      setPatrolGenerated(true);
      setShowRouteModal(true);
    }, 2000);
  };

  if (!data) return (
    <div className="flex flex-col items-center justify-center py-20 bg-gray-900/50 rounded-2xl border border-white/5">
      <FaBrain size={48} className="text-gray-700 mb-4 animate-pulse" />
      <p className="text-gray-500 text-sm font-medium">Analyzing historical patterns...</p>
      <p className="text-gray-600 text-xs mt-1">Predictions will appear once enough data is collected.</p>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-700">
      <PatrolRouteModal
        isOpen={showRouteModal}
        onClose={() => setShowRouteModal(false)}
        zones={data.riskZones}
      />
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-violet-600/20 via-slate-900 to-cyan-600/20 border border-violet-500/20 rounded-3xl p-5 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 shadow-2xl relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[80px] -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/10 blur-[80px] -ml-16 -mb-16" />

        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
            <FaBrain size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">AI Predictive Engine</h2>
            <p className="text-violet-300/60 text-xs sm:text-sm mt-1 max-w-md">
              Forecasting high-risk zones and peak times based on <span className="text-violet-300 font-bold">{stats?.total || 0}</span> historical records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8 sm:gap-10 z-10 bg-black/20 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/5 w-full sm:w-auto justify-center sm:justify-start sm:ml-auto">
          <div className="text-center">
            <p className="text-3xl font-black text-white tracking-tighter leading-none">{data.accuracyRate}%</p>
            <p className="text-[10px] text-violet-400 font-black uppercase tracking-[0.2em] mt-2">Accuracy</p>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Active</p>
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">Model State</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Zones */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard
            title="High-Risk Zone Forecast"
            subtitle="Locations with highest probability of lost items in the next 72 hours"
            action={<span className="text-[10px] text-gray-500 font-mono">Last updated: {new Date(data.lastModelUpdate).toLocaleTimeString()}</span>}
          >
            <div className="p-5 space-y-5">
              {data.riskZones.map((zone: any) => (
                <div key={zone.name} className="group relative bg-gray-800/30 hover:bg-gray-800/60 rounded-xl p-4 border border-white/5 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${zone.riskScore > 80 ? "bg-red-500/10 text-red-400" : "bg-orange-500/10 text-orange-400"
                        }`}>
                        <FaMapMarkerAlt size={14} />
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold group-hover:text-cyan-400 transition-colors">{zone.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{zone.trend} trend</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-black ${zone.riskScore > 80 ? "text-red-400" : "text-orange-400"
                        }`}>{zone.riskScore}%</p>
                      <p className="text-[10px] text-gray-600 font-bold uppercase">Risk Score</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-gray-500 font-medium mb-1">
                      <span>Historical Density</span>
                      <span>{zone.count} cases</span>
                    </div>
                    <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${zone.riskScore > 80 ? "bg-red-500" : "bg-orange-500"
                          }`}
                        style={{ width: `${zone.riskScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SectionCard title="Peak Time Predictions" subtitle="Forecasted reporting windows">
              <div className="p-5 space-y-4">
                {data.timeForecasts.map((t: any) => (
                  <div key={`${t.day}-${t.timeBlock}`} className="flex items-center gap-4 bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex flex-col items-center justify-center text-cyan-400">
                      <span className="text-[10px] font-bold leading-none">{t.day}</span>
                      <FaClock size={12} className="mt-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-bold truncate">{t.timeBlock.split('\n')[0]}</p>
                      <p className="text-[10px] text-gray-500 font-medium">{t.confidence} Confidence</p>
                    </div>
                    <div className="text-right">
                      <p className="text-cyan-400 text-sm font-black">{t.probability}%</p>
                      <p className="text-[9px] text-gray-600 font-bold uppercase">Prob.</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20">
                <FaBolt size={24} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Smart Patrol Mode</h4>
                <p className="text-gray-500 text-[10px] mt-1 px-4 leading-relaxed">AI suggests optimizing campus security patrol based on forecasted hotspots.</p>
              </div>
              <button
                onClick={handleGeneratePatrol}
                disabled={isPatrolling}
                className={`px-6 py-2 text-white text-xs font-bold rounded-xl transition-all shadow-lg w-full max-w-[160px] flex items-center justify-center gap-2
                    ${patrolGenerated
                    ? "bg-emerald-600 shadow-emerald-600/20"
                    : "bg-violet-600 hover:bg-violet-500 "
                  } ${isPatrolling ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isPatrolling ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Optimizing...
                  </>
                ) : patrolGenerated ? (
                  <>
                    <FaCheckCircle />
                    Route Ready
                  </>
                ) : (
                  "View Patrol Route"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Patrol Suggestions Sidebar */}
        <div className="space-y-6">
          <SectionCard title="Automated Suggestions" subtitle="Immediate actions for security teams">
            <div className="p-5 space-y-4">
              {data.patrolSuggestions.map((s: any, i: number) => (
                <div key={i} className="relative pl-4 border-l-2 border-violet-500/30 py-1">
                  <div className="flex items-start justify-between mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${s.priority === 'Critical' ? 'text-red-400' : 'text-cyan-400'
                      }`}>{s.priority} Priority</span>
                    <FaExclamationCircle size={10} className={s.priority === 'Critical' ? 'text-red-400' : 'text-cyan-400'} />
                  </div>
                  <p className="text-white text-xs font-bold leading-tight mb-1">{s.location}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <FaClock size={8} />
                    <span>Optimize patrol: {s.suggestedTime.split('\n')[0]}</span>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-2 italic">"{s.reason}"</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-white">
                <FaChartLine size={14} />
              </div>
              <p className="text-white text-sm font-bold">Trend Analysis</p>
            </div>
            <p className="text-gray-500 text-[11px] leading-relaxed">
              Current data indicates an **{data.riskZones[0]?.trend || 'stable'}** in item loss reports at **{data.riskZones[0]?.name || 'campus'}**.
            </p>
            <div className="pt-2">
              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-2">Recommendation</p>
              <div className="bg-gray-900 rounded-lg p-3 text-[10px] text-gray-400 border border-white/5 text-justify">
                Deploy temporary "Lost & Found" signage or mobile kiosks in {data.riskZones[0]?.name} during peak hours ({data.timeForecasts[0]?.timeBlock.split('\n')[0]}).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// MAIN: AnalyticsPage
// ════════════════════════════════════════════════════════════════════════════════
const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const { data: statsData, isLoading } = useAdminStatsQuery({});
  const stats = statsData?.data;

  if (isLoading) return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      <div className="h-12 w-full bg-gray-800/60 rounded-2xl" />
      <div className="h-10 w-48 bg-gray-800/60 rounded-xl" />
      <div className="h-80 bg-gray-800/60 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-80 bg-gray-800/60 rounded-2xl" />
        <div className="h-80 bg-gray-800/60 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* Tab bar + export row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Tabs */}
        <div className="grid grid-cols-5 bg-gray-900 border border-white/5 rounded-2xl p-1 gap-1 flex-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-2 sm:px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap justify-center border
                  ${active
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                    : "border-transparent text-gray-500 hover:text-white hover:bg-white/5"
                  }`}
              >
                <Icon size={14} className={`${active ? "text-cyan-400" : "text-gray-600"} shrink-0`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => printAnalyticsReport(stats)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-white/5 hover:border-white/10 text-gray-300 hover:text-white text-xs font-medium rounded-xl transition-all duration-200"
          >
            <FaPrint size={10} /> Print Report
          </button>
          <ExportButton
            label="Export"
            filename="nbsc-analytics"
            pdfTitle="NBSC Lost & Found — Analytics Report"
            getRows={() => (stats?.monthlyStats ?? []).map((m: any) => ({
              Month: m.month,
              "Found Items": m.found ?? 0,
              "Lost Reports": m.lost ?? 0,
              Claims: m.claims ?? 0,
              Resolved: m.resolved ?? 0,
              "Resolution Rate (%)": m.resolutionRate ?? 0,
            }))}
          />
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab stats={stats} />}
      {activeTab === "users" && <UserActivityTab stats={stats} />}
      {activeTab === "flow" && <ItemFlowTab stats={stats} />}
      {activeTab === "performance" && <PerformanceTab stats={stats} />}
      {activeTab === "predictive" && <PredictiveTab stats={stats} />}
    </div>
  );
};

export default AnalyticsPage;