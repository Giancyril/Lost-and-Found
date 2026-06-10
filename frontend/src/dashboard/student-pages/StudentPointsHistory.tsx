import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGetMyPointsQuery, useGetMyRankQuery } from "../../redux/api/api";
import { useUserVerification } from "../../auth/auth";
import { calculateLevel } from "../../utils/leveling";
import {
  FaStar, FaTrophy, FaArrowUp, FaArrowDown, FaBolt,
  FaChartLine, FaCalendarAlt, FaMedal,
} from "react-icons/fa";

// ── Reason display map ────────────────────────────────────────────────────────
const REASON_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  FOUND_ITEM_REPORTED:    { label: "Reported found item",    color: "text-emerald-400", bg: "bg-emerald-500/10", icon: <FaStar size={10} className="text-emerald-400" /> },
  CLAIM_APPROVED:         { label: "Claim approved",         color: "text-cyan-400",    bg: "bg-cyan-500/10",    icon: <FaTrophy size={10} className="text-cyan-400" /> },
  HELPFUL_COMMENT:        { label: "Helpful comment",        color: "text-violet-400",  bg: "bg-violet-500/10",  icon: <FaStar size={10} className="text-violet-400" /> },
  ACHIEVEMENT_BONUS:      { label: "Achievement bonus",      color: "text-yellow-400",  bg: "bg-yellow-500/10",  icon: <FaMedal size={10} className="text-yellow-400" /> },
  LOGIN_STREAK_BONUS:     { label: "Login streak bonus",     color: "text-orange-400",  bg: "bg-orange-500/10",  icon: <FaBolt size={10} className="text-orange-400" /> },
  BOUNTY_COMPLETED:       { label: "Bounty completed",       color: "text-pink-400",    bg: "bg-pink-500/10",    icon: <FaTrophy size={10} className="text-pink-400" /> },
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
  { id: "all",      label: "All"       },
  { id: "earned",   label: "Earned"    },
  { id: "deducted", label: "Deducted"  },
];

export default function StudentPointsHistory() {
  const user: any = useUserVerification();
  const isLoggedIn = !!user?.id;
  const [filter, setFilter] = useState("all");
  const [page,   setPage]   = useState(1);
  const PER_PAGE = 20;

  const { data: pointsData, isLoading } = useGetMyPointsQuery(undefined, { skip: !isLoggedIn });
  const { data: rankData } = useGetMyRankQuery(undefined, { skip: !isLoggedIn });

  const totalPoints: number   = pointsData?.data?.totalPoints ?? 0;
  const history: any[]        = pointsData?.data?.history     ?? [];
  const loginStreak: number   = pointsData?.data?.loginStreak ?? 0;
  const myRank: number        = rankData?.data?.rank          ?? 0;
  const myDelta: number | null = rankData?.data?.delta        ?? null;

  const { level, rankTitle, progressPercent, nextLevelTotalXp } = calculateLevel(totalPoints);

  // Apply filter
  const filtered = history.filter((h: any) => {
    if (filter === "earned")   return h.amount > 0;
    if (filter === "deducted") return h.amount < 0;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Aggregate stats
  const earned   = history.filter((h: any) => h.amount > 0).reduce((s: number, h: any) => s + h.amount, 0);
  const deducted = Math.abs(history.filter((h: any) => h.amount < 0).reduce((s: number, h: any) => s + h.amount, 0));

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-900 border border-white/5 rounded-2xl" />)}
        </div>
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
              <span className="text-sm">🔥</span>
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
                className={`flex-1 sm:flex-none text-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:ring-0 select-none ${
                  filter === f.id
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
                          className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
                            p === page
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
