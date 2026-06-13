import React from "react";
import { Link } from "react-router-dom";
import {
  FaFire, FaBolt, FaTrophy, FaChevronUp, FaChevronDown,
  FaMinus, FaMedal, FaArrowRight,
} from "react-icons/fa";

// ── Streak milestones ─────────────────────────────────────────────────────────
const STREAK_MILESTONES = [3, 7, 14, 30, 100];
const nextMilestone = (streak: number) =>
  STREAK_MILESTONES.find((m) => m > streak) ?? null;

// ── Tier ordering for highest-unlocked ───────────────────────────────────────
const TIER_RANK: Record<string, number> = {
  BRONZE: 1, SILVER: 2, GOLD: 3, PLATINUM: 4, LEGEND: 5,
};

const TIER_STYLES: Record<string, { text: string; bar: string; bg: string; border: string; label: string }> = {
  BRONZE:   { text: "text-amber-500",  bar: "from-amber-600 to-amber-400",   bg: "bg-amber-500/10",  border: "border-amber-500/20",  label: "Bronze"   },
  SILVER:   { text: "text-gray-300",   bar: "from-gray-500 to-gray-300",     bg: "bg-gray-400/10",   border: "border-gray-400/20",   label: "Silver"   },
  GOLD:     { text: "text-yellow-400", bar: "from-yellow-500 to-yellow-300", bg: "bg-yellow-400/10", border: "border-yellow-400/20", label: "Gold"     },
  PLATINUM: { text: "text-cyan-400",   bar: "from-cyan-500 to-cyan-300",     bg: "bg-cyan-400/10",   border: "border-cyan-400/20",   label: "Platinum" },
  LEGEND:   { text: "text-purple-400", bar: "from-purple-600 to-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", label: "Legend"   },
};

interface GamificationWidgetProps {
  streak: { currentStreak: number; isOnARoll: boolean };
  loginStreak: number;
  boostEvent: any | null;
  rankDelta: number | null;
  myRank: number;
  myAchievements: any[];
  allAchievements: any[];
}

const GamificationWidget: React.FC<GamificationWidgetProps> = ({
  streak,
  loginStreak,
  boostEvent,
  rankDelta,
  myRank,
  myAchievements,
}) => {
  // ── Derived data ──────────────────────────────────────────────────────────
  const nextM      = nextMilestone(loginStreak);
  const streakPct  = nextM ? Math.min(Math.round((loginStreak / nextM) * 100), 100) : 100;

  const rankUp     = rankDelta != null && rankDelta > 0;
  const rankDown   = rankDelta != null && rankDelta < 0;
  const rankSame   = rankDelta === 0;

  // Highest tier unlocked badge
  const highestBadge = myAchievements.reduce<any>((best, ua) => {
    const t = ua.achievement?.tier ?? "BRONZE";
    if (!best) return ua;
    return TIER_RANK[t] > TIER_RANK[best.achievement?.tier ?? "BRONZE"] ? ua : best;
  }, null);

  const highestStyle = highestBadge
    ? (TIER_STYLES[highestBadge.achievement?.tier] ?? TIER_STYLES.BRONZE)
    : null;

  // Most recently unlocked badge
  const latestBadge = myAchievements[0] ?? null;

  return (
    <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <FaBolt size={12} className="text-yellow-400" />
          <h3 className="text-white text-sm font-semibold">Your Progress</h3>
        </div>
        <Link
          to="/dashboard/student/achievements"
          className="text-[10px] font-bold text-gray-500 hover:text-cyan-400 transition-colors flex items-center gap-1"
        >
          View Achievements <FaArrowRight size={8} />
        </Link>
      </div>

      <div className="p-4 sm:p-5 grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* ── 1. Streak Card ── */}
        <div className={`relative rounded-xl p-4 border overflow-hidden transition-all ${
          loginStreak >= 3
            ? "bg-orange-500/10 border-orange-500/20"
            : "bg-white/[0.02] border-white/5"
        }`}>
          {loginStreak >= 3 && (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent pointer-events-none" />
          )}
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                loginStreak >= 3
                  ? "bg-orange-500/20 border border-orange-500/30"
                  : "bg-white/5 border border-white/10"
              }`}>
                <FaFire size={15} className={loginStreak >= 3 ? "text-orange-400" : "text-gray-600"} />
              </div>
              {streak.isOnARoll && (
                <span className="text-[9px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  On Fire!
                </span>
              )}
            </div>

            <p className={`text-2xl sm:text-3xl font-black tracking-tight leading-none ${loginStreak > 0 ? "text-orange-400" : "text-gray-600"}`}>
              {loginStreak > 0 ? loginStreak : "—"}
            </p>
            {loginStreak > 0 && (
              <p className="text-orange-400/60 text-[10px] font-bold mt-0.5">day streak</p>
            )}
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Login Streak</p>

            {nextM && loginStreak > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-[9px] text-gray-600 mb-1.5">
                  <span>{loginStreak} days</span>
                  <span>{nextM}-day milestone</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-700"
                    style={{ width: `${streakPct}%` }}
                  />
                </div>
              </div>
            )}
            {loginStreak === 0 && (
              <p className="text-[10px] text-gray-600 mt-2 leading-relaxed">
                Log in daily to build a streak &amp; earn bonus XP every 3+ days
              </p>
            )}
          </div>
        </div>

        {/* ── 2. Rank Change Card ── */}
        <div className="relative rounded-xl p-4 border bg-white/[0.02] border-white/5 overflow-hidden">
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                <FaTrophy size={15} className="text-indigo-400" />
              </div>
              {rankDelta !== null && rankDelta !== 0 && (
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-0.5 ${
                  rankUp
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}>
                  {rankUp ? <FaChevronUp size={7} /> : <FaChevronDown size={7} />}
                  {Math.abs(rankDelta!)}
                </span>
              )}
              {rankSame && rankDelta !== null && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full border bg-slate-800 text-slate-500 border-slate-700 flex items-center gap-0.5">
                  <FaMinus size={7} /> —
                </span>
              )}
            </div>

            <p className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-indigo-400">
              {myRank > 0 ? `#${myRank}` : "—"}
            </p>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Campus Rank</p>

            <p className="text-[10px] text-gray-600 mt-2 leading-relaxed">
              {rankDelta != null && rankUp && `▲ Up ${rankDelta} place${rankDelta > 1 ? "s" : ""} since yesterday`}
              {rankDelta != null && rankDown && `▼ Down ${Math.abs(rankDelta!)} place${Math.abs(rankDelta!) > 1 ? "s" : ""} since yesterday`}
              {rankDelta != null && rankSame && "No rank change since yesterday"}
              {rankDelta == null && myRank === 0 && "Report a found item to earn your first rank!"}
              {rankDelta == null && myRank > 0 && `Ranked #${myRank} on campus`}
            </p>
          </div>
        </div>

        {/* ── 3. XP Boost Card ── */}
        <div className={`relative rounded-xl p-4 border overflow-hidden transition-all ${
          boostEvent
            ? "bg-yellow-500/10 border-yellow-500/20"
            : "bg-white/[0.02] border-white/5"
        }`}>
          {boostEvent && (
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent pointer-events-none" />
          )}
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                boostEvent
                  ? "bg-yellow-500/20 border border-yellow-500/30"
                  : "bg-white/5 border border-white/10"
              }`}>
                <FaBolt size={15} className={boostEvent ? "text-yellow-400 animate-pulse" : "text-gray-600"} />
              </div>
              {boostEvent && (
                <span className="text-[9px] font-black bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  ACTIVE
                </span>
              )}
            </div>

            <p className={`text-2xl sm:text-3xl font-black tracking-tight leading-none ${boostEvent ? "text-yellow-400" : "text-gray-600"}`}>
              {boostEvent ? `${boostEvent.multiplier}×` : "1×"}
            </p>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">XP Multiplier</p>

            {boostEvent ? (
              <div className="mt-2">
                <p className="text-yellow-300 text-xs font-semibold truncate">{boostEvent.name}</p>
                <p className="text-yellow-700 text-[10px] mt-0.5">
                  Ends {new Date(boostEvent.endDate).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-gray-600 mt-2 leading-relaxed">
                No active boost — earn XP at the standard rate
              </p>
            )}
          </div>
        </div>

        {/* ── 4. Badge Progress Card ── */}
        <div className="relative rounded-xl p-4 border bg-white/[0.02] border-white/5 overflow-hidden">
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
                <FaMedal size={15} className="text-purple-400" />
              </div>
              <Link
                to="/dashboard/student/achievements"
                className="text-[9px] font-bold text-gray-600 hover:text-purple-400 transition-colors"
              >
                VIEW ALL
              </Link>
            </div>

            <p className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-purple-400">
              {myAchievements.length}
            </p>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Badges Earned</p>

            {myAchievements.length === 0 ? (
              <p className="text-[10px] text-gray-600 mt-2 leading-relaxed">
                Report a found item to unlock your first badge!
              </p>
            ) : highestBadge && highestStyle ? (
              <div className="mt-3">
                <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${highestStyle.bg} ${highestStyle.border}`}>
                  <span className="text-sm leading-none">{highestBadge.achievement?.icon}</span>
                  <div className="min-w-0">
                    <p className={`text-[10px] font-black truncate ${highestStyle.text}`}>
                      {highestBadge.achievement?.name}
                    </p>
                    <p className={`text-[8px] font-bold uppercase tracking-wider ${highestStyle.text} opacity-70`}>
                      {highestStyle.label} · Highest Tier
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {latestBadge && latestBadge !== highestBadge && (
              <p className="text-[9px] text-gray-600 mt-2 truncate">
                Latest: {latestBadge.achievement?.name}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default GamificationWidget;
