import React, { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useGetMyPointsQuery, useGetMyRankQuery } from "../../redux/api/api";
import { useUserVerification } from "../../auth/auth";
import { calculateLevel } from "../../utils/leveling";
import {
  FaStar, FaTrophy, FaArrowUp, FaArrowDown, FaBolt,
  FaChartLine, FaCalendarAlt, FaMedal, FaFire,
} from "react-icons/fa";

// ── Reason display map ────────────────────────────────────────────────────────
const REASON_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  FOUND_ITEM_REPORTED: { label: "Reported found item", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: <FaStar size={10} className="text-emerald-400" /> },
  CLAIM_APPROVED: { label: "Claim approved", color: "text-cyan-400", bg: "bg-cyan-500/10", icon: <FaTrophy size={10} className="text-cyan-400" /> },
  HELPFUL_COMMENT: { label: "Helpful comment", color: "text-violet-400", bg: "bg-violet-500/10", icon: <FaStar size={10} className="text-violet-400" /> },
  ACHIEVEMENT_BONUS: { label: "Achievement bonus", color: "text-yellow-400", bg: "bg-yellow-500/10", icon: <FaMedal size={10} className="text-yellow-400" /> },
  LOGIN_STREAK_BONUS: { label: "Login streak bonus", color: "text-orange-400", bg: "bg-orange-500/10", icon: <FaBolt size={10} className="text-orange-400" /> },
  BOUNTY_COMPLETED: { label: "Bounty completed", color: "text-pink-400", bg: "bg-pink-500/10", icon: <FaTrophy size={10} className="text-pink-400" /> },
};

const getReasonMeta = (reason: string) =>
  REASON_META[reason] ?? {
    label: reason?.replace(/_/g, " ") ?? "Unknown",
    color: "text-gray-400",
    bg: "bg-gray-500/10",
    icon: <FaStar size={10} className="text-gray-400" />,
  };

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({
  label, value, sub, icon, accent, bg,
}: { label: string; value: string | number; sub?: string; icon: React.ReactNode; accent: string; bg: string }) => (
  <div className="bg-gray-900 border border-white/5 rounded-2xl p-3 sm:p-4 flex items-center justify-between relative overflow-hidden">
    <div className={`absolute inset-0 opacity-20 ${bg} blur-3xl scale-150 pointer-events-none`} />
    <div className="relative">
      <p className={`text-xl sm:text-2xl font-black tracking-tight ${accent}`}>{value}</p>
      {sub && <p className="text-[9px] text-gray-500 font-medium mt-0.5">{sub}</p>}
      <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-0.5 font-bold">{label}</p>
    </div>
    <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center ${bg} border border-white/5`}>{icon}</div>
  </div>
);

// ── Filter tabs ───────────────────────────────────────────────────────────────
const FILTERS = [
  { id: "all", label: "All" },
  { id: "earned", label: "Earned" },
  { id: "deducted", label: "Deducted" },
];

// ── XP Chart ─────────────────────────────────────────────────────────────────
interface DayBucket {
  label: string;    // "Jun 5"
  dateStr: string;  // ISO date key
  xp: number;       // total XP earned (positive)
  loss: number;     // total XP lost (positive number)
}

function buildBuckets(history: any[], days: number): DayBucket[] {
  const buckets: DayBucket[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    buckets.push({ label, dateStr, xp: 0, loss: 0 });
  }

  for (const h of history) {
    if (!h.createdAt) continue;
    const key = new Date(h.createdAt).toISOString().slice(0, 10);
    const bucket = buckets.find(b => b.dateStr === key);
    if (!bucket) continue;
    if (h.amount > 0) bucket.xp += h.amount;
    else bucket.loss += Math.abs(h.amount);
  }

  return buckets;
}

function XpChart({ history }: { history: any[] }) {
  const [range, setRange] = useState<7 | 30 | 90>(7);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; bucket: DayBucket } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const buckets = buildBuckets(history, range);
  const maxXp = Math.max(...buckets.map(b => b.xp), 1);

  // Chart dimensions
  const W = 800, H = 180;
  const PAD_L = 40, PAD_R = 16, PAD_T = 16, PAD_B = 36;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const n = buckets.length;
  const step = chartW / Math.max(n - 1, 1);

  const pts = buckets.map((b, i) => ({
    x: PAD_L + i * step,
    y: PAD_T + chartH - (b.xp / maxXp) * chartH,
    bucket: b,
  }));

  // Smooth bezier path
  const toPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cp1x = points[i - 1].x + step * 0.4;
      const cp1y = points[i - 1].y;
      const cp2x = points[i].x - step * 0.4;
      const cp2y = points[i].y;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i].x},${points[i].y}`;
    }
    return d;
  };

  const linePath = toPath(pts);
  const areaPath = pts.length
    ? `${linePath} L ${pts[pts.length - 1].x},${PAD_T + chartH} L ${pts[0].x},${PAD_T + chartH} Z`
    : "";

  const totalPeriodXp = buckets.reduce((s, b) => s + b.xp, 0);
  const activeDays = buckets.filter(b => b.xp > 0 || b.loss > 0).length;

  const findNearest = useCallback((clientX: number, rect: DOMRect) => {
    const scaleX = W / rect.width;
    const mx = (clientX - rect.left) * scaleX;
    let nearest = pts[0];
    let minDist = Infinity;
    for (const p of pts) {
      const d = Math.abs(p.x - mx);
      if (d < minDist) { minDist = d; nearest = p; }
    }
    setTooltip({ x: nearest.x, y: nearest.y, bucket: nearest.bucket });
  }, [pts]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    findNearest(e.clientX, svgRef.current.getBoundingClientRect());
  }, [findNearest]);

  const handleTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (!svgRef.current || !e.touches[0]) return;
    e.preventDefault();
    findNearest(e.touches[0].clientX, svgRef.current.getBoundingClientRect());
  }, [findNearest]);

  // Y-axis labels
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: PAD_T + chartH - f * chartH,
    label: Math.round(f * maxXp).toLocaleString(),
  }));

  // Best Earning Day calculation
  const bestDay = buckets.reduce((max, b) => b.xp > max.xp ? b : max, { label: "N/A", xp: 0 });
  const bestDayDisplay = bestDay.xp > 0 ? `${bestDay.label} (+${bestDay.xp} XP)` : "None";

  // Best Earning Week calculation (7-day window)
  let bestWeekSum = 0;
  let bestWeekStart = "";
  let bestWeekEnd = "";
  if (buckets.length >= 7) {
    for (let i = 0; i <= buckets.length - 7; i++) {
      let sum = 0;
      for (let j = 0; j < 7; j++) {
        sum += buckets[i + j].xp;
      }
      if (sum > bestWeekSum) {
        bestWeekSum = sum;
        bestWeekStart = buckets[i].label;
        bestWeekEnd = buckets[i + 6].label;
      }
    }
  } else {
    bestWeekSum = buckets.reduce((s, b) => s + b.xp, 0);
    bestWeekStart = buckets[0]?.label ?? "";
    bestWeekEnd = buckets[buckets.length - 1]?.label ?? "";
  }
  const bestWeekDisplay = bestWeekSum > 0 ? `${bestWeekStart} - ${bestWeekEnd} (+${bestWeekSum} XP)` : "None";

  // Reason breakdown calculation in selected range
  const rangeStartDate = new Date();
  rangeStartDate.setDate(rangeStartDate.getDate() - range);

  const rangeHistory = history.filter(h => {
    if (!h.createdAt || h.amount <= 0) return false;
    return new Date(h.createdAt) >= rangeStartDate;
  });

  const breakdown: Record<string, number> = {};
  let totalEarnedInRange = 0;
  for (const h of rangeHistory) {
    breakdown[h.reason] = (breakdown[h.reason] ?? 0) + h.amount;
    totalEarnedInRange += h.amount;
  }

  const sortedBreakdown = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

  // Donut chart math
  let accumulatedPercent = 0;
  const donutSegments = sortedBreakdown.map(([reason, amount]) => {
    const percent = amount / totalEarnedInRange;
    const strokeLength = percent * 251.327;
    const strokeOffset = -accumulatedPercent * 251.327;
    accumulatedPercent += percent;
    return {
      reason,
      amount,
      percent,
      strokeLength,
      strokeOffset,
    };
  });

  return (
    <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <FaChartLine size={11} className="text-blue-400" />
          <div>
            <h2 className="text-[11px] font-black text-white uppercase tracking-widest">XP Activity Chart</h2>
            <p className="text-gray-500 text-[10px] mt-0.5">
              +{totalPeriodXp.toLocaleString()} XP over {range} days · {activeDays} active days
            </p>
          </div>
        </div>

        {/* Range toggle */}
        <div className="flex gap-1 bg-gray-800/60 rounded-xl p-1 self-start sm:self-auto">
          {([7, 30, 90] as const).map(d => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors focus:outline-none focus-visible:outline-none active:scale-[1] select-none outline-none ${range === d
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/20"
                  : "text-gray-500 hover:text-gray-300"
                }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Callouts Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 sm:p-5 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3">
          <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
            <FaStar size={12} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Best Earning Day</p>
            <p className="text-xs font-black text-white mt-0.5">{bestDayDisplay}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <FaCalendarAlt size={12} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Most Active Week</p>
            <p className="text-xs font-black text-white mt-0.5">{bestWeekDisplay}</p>
          </div>
        </div>
      </div>

      {/* Grid Layout: Line Chart + Donut Chart */}
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-white/5">
        {/* Left Column: Line Chart */}
        <div className="md:col-span-7 lg:col-span-8 p-4 sm:p-5 relative">
          {totalPeriodXp === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
              <FaChartLine size={22} className="text-gray-700 mb-2" />
              <p className="text-gray-600 text-xs font-medium">No XP earned in this period</p>
            </div>
          )}

          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full touch-none"
            style={{ minHeight: 140 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setTooltip(null)}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setTooltip(null)}
          >
            <defs>
              <linearGradient id="xpAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="xpLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid lines + Y labels */}
            {yTicks.map((t, i) => (
              <g key={i}>
                <line
                  x1={PAD_L} y1={t.y} x2={W - PAD_R} y2={t.y}
                  stroke="#ffffff" strokeOpacity="0.04" strokeWidth="1"
                />
                <text x={PAD_L - 6} y={t.y + 4} textAnchor="end" fill="#6b7280" fontSize="9">
                  {t.label}
                </text>
              </g>
            ))}

            {/* Zero baseline */}
            <line
              x1={PAD_L} y1={PAD_T + chartH} x2={W - PAD_R} y2={PAD_T + chartH}
              stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1"
            />

            {/* Area fill */}
            {areaPath && (
              <path d={areaPath} fill="url(#xpAreaGrad)" />
            )}

            {/* Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="url(#xpLineGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />
            )}

            {/* Bar columns (hover zone + deduction) */}
            {pts.map((p, i) => {
              const barW = Math.max(step * 0.6, 8);
              const lossH = (buckets[i].loss / maxXp) * chartH;
              return (
                <g key={i}>
                  {buckets[i].loss > 0 && (
                    <rect
                      x={p.x - barW / 2}
                      y={PAD_T + chartH}
                      width={barW}
                      height={Math.min(lossH, 10)}
                      rx="2"
                      fill="#ef4444"
                      fillOpacity="0.5"
                      transform={`translate(0, ${-Math.min(lossH, 10)})`}
                    />
                  )}
                  <rect
                    x={p.x - step / 2}
                    y={PAD_T}
                    width={step}
                    height={chartH}
                    fill="transparent"
                  />
                </g>
              );
            })}

            {/* Data point dots */}
            {pts.map((p, i) => (
              buckets[i].xp > 0 ? (
                <circle
                  key={i}
                  cx={p.x} cy={p.y} r="3.5"
                  fill="#1d1d1d"
                  stroke="url(#xpLineGrad)"
                  strokeWidth="2"
                />
              ) : null
            ))}

            {/* Tooltip line + dot */}
            {tooltip && (
              <>
                <line
                  x1={tooltip.x} y1={PAD_T}
                  x2={tooltip.x} y2={PAD_T + chartH}
                  stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="4 3"
                />
                <circle
                  cx={tooltip.x} cy={tooltip.y} r="5"
                  fill="#3b82f6" stroke="#111827" strokeWidth="2"
                />
              </>
            )}

            {/* X-axis labels */}
            {pts.map((p, i) => {
              const skip = range === 90 ? 12 : range === 30 ? 4 : 1;
              if (i % skip !== 0 && i !== pts.length - 1) return null;
              return (
                <text
                  key={i}
                  x={p.x} y={H - 6}
                  textAnchor="middle"
                  fill="#6b7280"
                  fontSize="9"
                >
                  {buckets[i].label}
                </text>
              );
            })}
          </svg>

          {/* Tooltip Card */}
          {tooltip && (
            <div
              className="absolute pointer-events-none z-20 bg-gray-800 border border-white/10 rounded-xl px-3 py-2 shadow-2xl text-xs min-w-[130px]"
              style={{
                left: `clamp(8px, ${(tooltip.x / W) * 100}%, calc(100% - 148px))`,
                top: 75,
              }}
            >
              <p className="text-gray-400 font-semibold mb-1.5 flex items-center gap-1.5">
                <FaCalendarAlt size={9} className="text-gray-500" />
                {tooltip.bucket.label}
              </p>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">Earned</span>
                  <span className="text-yellow-400 font-black">+{tooltip.bucket.xp} XP</span>
                </div>
                {tooltip.bucket.loss > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Deducted</span>
                    <span className="text-red-400 font-black">-{tooltip.bucket.loss} XP</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/5">
                  <span className="text-gray-500">Net</span>
                  <span className={`font-black ${tooltip.bucket.xp - tooltip.bucket.loss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {tooltip.bucket.xp - tooltip.bucket.loss >= 0 ? "+" : ""}{tooltip.bucket.xp - tooltip.bucket.loss} XP
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Line Chart Legend */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded bg-gradient-to-r from-indigo-400 to-sky-400" />
              <span className="text-gray-500 text-[10px]">XP Earned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded bg-red-500/50" />
              <span className="text-gray-500 text-[10px]">XP Lost</span>
            </div>
          </div>
        </div>

        {/* Right Column: Donut Chart + Breakdown */}
        <div className="md:col-span-5 lg:col-span-4 p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <FaTrophy size={11} className="text-indigo-400" />
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest">XP Breakdown</h3>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-5 items-center justify-center sm:justify-start md:justify-center">
            {/* SVG Donut */}
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {totalEarnedInRange === 0 ? (
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#1f2937"
                    strokeWidth="10"
                  />
                ) : (
                  donutSegments.map((seg, idx) => {
                    const colorMap: Record<string, string> = {
                      FOUND_ITEM_REPORTED: "#10b981",
                      CLAIM_APPROVED: "#06b6d4",
                      HELPFUL_COMMENT: "#8b5cf6",
                      ACHIEVEMENT_BONUS: "#eab308",
                      LOGIN_STREAK_BONUS: "#f97316",
                      BOUNTY_COMPLETED: "#ec4899",
                    };
                    const strokeColor = colorMap[seg.reason] ?? "#9ca3af";
                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke={strokeColor}
                        strokeWidth="10"
                        strokeDasharray={`${seg.strokeLength} 251.327`}
                        strokeDashoffset={seg.strokeOffset}
                        className="transition-all duration-300 hover:stroke-[12px]"
                      />
                    );
                  })
                )}
              </svg>
              {/* Central text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider leading-none">Total</span>
                <span className="text-sm font-black text-white mt-0.5 leading-none">+{totalEarnedInRange}</span>
                <span className="text-[8px] text-gray-600 font-semibold uppercase mt-0.5 leading-none">XP</span>
              </div>
            </div>

            {/* List with Progress Bars */}
            <div className="flex-1 w-full space-y-2.5">
              {totalEarnedInRange === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 text-xs font-semibold">No XP distribution data</p>
                </div>
              ) : (
                sortedBreakdown.map(([reason, amount]) => {
                  const meta = getReasonMeta(reason);
                  const percent = (amount / totalEarnedInRange) * 100;
                  const colorMap: Record<string, string> = {
                    FOUND_ITEM_REPORTED: "bg-emerald-500",
                    CLAIM_APPROVED: "bg-cyan-500",
                    HELPFUL_COMMENT: "bg-violet-500",
                    ACHIEVEMENT_BONUS: "bg-yellow-500",
                    LOGIN_STREAK_BONUS: "bg-orange-500",
                    BOUNTY_COMPLETED: "bg-pink-500",
                  };
                  const progressColor = colorMap[reason] ?? "bg-gray-500";
                  return (
                    <div key={reason} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-semibold">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${progressColor}`} />
                          <span className="text-gray-400 truncate">{meta.label}</span>
                        </div>
                        <span className="text-white font-bold ml-2 shrink-0">
                          {amount} XP <span className="text-gray-500 text-[9px] font-normal">({Math.round(percent)}%)</span>
                        </span>
                      </div>
                      <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${progressColor}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentPointsHistory() {
  const user: any = useUserVerification();
  const isLoggedIn = !!user?.id;
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const { data: pointsData, isLoading } = useGetMyPointsQuery(undefined, { skip: !isLoggedIn });
  const { data: rankData } = useGetMyRankQuery(undefined, { skip: !isLoggedIn });

  const totalPoints: number = pointsData?.data?.totalPoints ?? 0;
  const history: any[] = pointsData?.data?.history ?? [];
  const loginStreak: number = pointsData?.data?.loginStreak ?? 0;
  const myRank: number = rankData?.data?.rank ?? 0;
  const myDelta: number | null = rankData?.data?.delta ?? null;

  const { level, rankTitle, progressPercent, nextLevelTotalXp } = calculateLevel(totalPoints);

  // Apply filter
  const filtered = history.filter((h: any) => {
    if (filter === "earned") return h.amount > 0;
    if (filter === "deducted") return h.amount < 0;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Aggregate stats
  const earned = history.filter((h: any) => h.amount > 0).reduce((s: number, h: any) => s + h.amount, 0);
  const deducted = Math.abs(history.filter((h: any) => h.amount < 0).reduce((s: number, h: any) => s + h.amount, 0));

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-900 border border-white/5 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-gray-900 border border-white/5 rounded-2xl" />
        <div className="h-96 bg-gray-900 border border-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-5 max-w-7xl mx-auto pb-10 px-2 sm:px-0">

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatCard
          label="Total XP"
          value={totalPoints.toLocaleString()}
          sub={`Level ${level} · ${rankTitle}`}
          icon={<FaStar size={14} className="text-yellow-400" />}
          accent="text-yellow-400"
          bg="bg-yellow-500/5"
        />
        <StatCard
          label="Campus Rank"
          value={myRank > 0 ? `#${myRank}` : "—"}
          sub={myDelta !== null && myDelta !== 0
            ? (myDelta > 0 ? `▲${myDelta} from last week` : `▼${Math.abs(myDelta)} from last week`)
            : undefined}
          icon={<FaTrophy size={14} className="text-cyan-400" />}
          accent="text-cyan-400"
          bg="bg-cyan-500/5"
        />
        <StatCard
          label="Total Earned"
          value={`+${earned.toLocaleString()}`}
          sub={`${history.filter((h: any) => h.amount > 0).length} transactions`}
          icon={<FaArrowUp size={14} className="text-emerald-400" />}
          accent="text-emerald-400"
          bg="bg-emerald-500/5"
        />
        <StatCard
          label="Deducted"
          value={deducted > 0 ? `-${deducted.toLocaleString()}` : "None"}
          sub={deducted > 0 ? `${history.filter((h: any) => h.amount < 0).length} transactions` : "Clean record"}
          icon={<FaArrowDown size={14} className="text-red-400" />}
          accent={deducted > 0 ? "text-red-400" : "text-gray-500"}
          bg="bg-red-500/5"
        />
      </div>

      {/* ── XP Progress bar ── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex flex-col items-center justify-center">
              <span className="text-[7px] font-bold text-yellow-500 leading-none">LVL</span>
              <span className="text-yellow-400 text-xs font-black leading-none mt-0.5">{level}</span>
            </div>
            <div>
              <p className="text-white text-sm font-black">{totalPoints.toLocaleString()} XP</p>
              <p className="text-yellow-500 text-[10px] font-bold uppercase tracking-wider">{rankTitle}</p>
            </div>
          </div>
          {loginStreak >= 3 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
              <FaFire size={10} className="text-orange-400" />
              <span className="text-xs font-black text-orange-400">{loginStreak} day streak</span>
            </div>
          )}
        </div>
        {level < 100 && (
          <>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%`, background: "linear-gradient(90deg, #eab308, #f59e0b)" }}
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 text-right">
              {(nextLevelTotalXp - totalPoints).toLocaleString()} XP to Level {level + 1}
            </p>
          </>
        )}
      </div>

      {/* ── Transaction history ── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <FaChartLine size={12} className="text-blue-400 shrink-0" />
              <h2 className="text-[11px] font-black text-white uppercase tracking-widest whitespace-nowrap">
                Points History
              </h2>
            </div>
            <span className="text-[10px] text-gray-600 font-bold whitespace-nowrap">{filtered.length} entries</span>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 bg-gray-800/60 rounded-xl p-1 w-full sm:w-auto">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => { setFilter(f.id); setPage(1); }}
                className={`flex-1 sm:flex-none text-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:ring-0 select-none ${filter === f.id
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/20"
                    : "text-gray-500 hover:text-gray-300"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <FaStar size={28} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No transactions yet</p>
            <p className="text-gray-600 text-xs mt-1">Report a found item to earn your first 50 XP</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800/30 border-b border-white/5">
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {paginated.map((h: any, i: number) => {
                    const meta = getReasonMeta(h.reason);
                    const isPositive = h.amount > 0;
                    return (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                              {meta.icon}
                            </div>
                            <p className={`text-sm font-semibold ${meta.color}`}>{meta.label}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                            <FaCalendarAlt size={9} className="text-gray-600" />
                            {h.createdAt
                              ? new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "—"}
                          </div>
                          {h.createdAt && (
                            <p className="text-gray-600 text-[10px] mt-0.5">
                              {new Date(h.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`text-base font-black ${isPositive ? "text-yellow-400" : "text-red-400"}`}>
                            {isPositive ? "+" : ""}{h.amount}
                          </span>
                          <p className="text-gray-600 text-[10px] mt-0.5">XP</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="sm:hidden divide-y divide-white/[0.04]">
              {paginated.map((h: any, i: number) => {
                const meta = getReasonMeta(h.reason);
                const isPositive = h.amount > 0;
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${meta.color}`}>{meta.label}</p>
                      <p className="text-gray-600 text-[10px] mt-0.5">
                        {h.createdAt
                          ? new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </p>
                    </div>
                    <span className={`text-sm font-black shrink-0 ${isPositive ? "text-yellow-400" : "text-red-400"}`}>
                      {isPositive ? "+" : ""}{h.amount}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 sm:px-5 py-3 border-t border-white/5 flex items-center justify-between gap-3">
                <p className="text-gray-600 text-[11px]">
                  Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => (
                      <div key={p} className="contents">
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span className="px-2 py-1.5 text-[11px] text-gray-600">…</span>
                        )}
                        <button
                          onClick={() => setPage(p)}
                          className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${p === page
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/20"
                              : "bg-gray-800 hover:bg-gray-700 text-gray-400"
                            }`}
                        >
                          {p}
                        </button>
                      </div>
                    ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── XP Chart ── */}
      <XpChart history={history} />

      {/* ── Back to leaderboard ── */}
      <div className="flex justify-center">
        <Link
          to="/dashboard/student/leaderboard"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 border border-white/5 text-gray-400 hover:text-white hover:border-white/10 transition-all text-xs font-semibold"
        >
          <FaTrophy size={10} />
          View Leaderboard
        </Link>
      </div>
    </div>
  );
}
